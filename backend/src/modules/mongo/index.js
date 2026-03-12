const sqlite3 = require('sqlite3').verbose();
const { QueryComparison, Logical, Evaluation } = require("./operators")
const ModelType = require("./modelType");
class Database {
    // sqlite3.Database
    constructor(path) {
        this.db = new sqlite3.Database(path)
        this.db.run(`PRAGMA journal_mode = WAL;`);
        this.db.run(`PRAGMA busy_timeout = 3000;`);
        this.transactionLock = Promise.resolve();
    }

    serialize(params, cb) {
        return new Promise((resolve) => {
            this.db.serialize(params, async () => resolve(await cb(this.db)));
        })
    }

    prepare(params) {
        return new Promise((resolve, reject) => {
            this.db.prepare(params, (stmt, err) => {
                if (err) reject(err);
                else resolve(stmt);
            });
        });
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) return reject(err);
                resolve({
                    lastID: this.lastID,
                    changes: this.changes
                });
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }


    /**
  * 用 Promise 链做队列
  * 在事务中执行给定的函数
  * 如果函数执行成功，当前事务将被提交
  * 如果函数执行失败，当前事务将被回退
  * @param {function} fn - 需要执行的函数
  * @returns {Promise} - Promise 对象
  */
    async runInTransaction(fn) {
        const release = this.db.transactionLock;
        let nextResolve;
        // 创建一个 事务锁对象
        this.db.transactionLock = new Promise(r => nextResolve = r);
        await release;   // ✅ 等前面的事务完成
        let beginTransaction = false;
        try {
            // 开启事务
            await this.run("BEGIN TRANSACTION;");
            beginTransaction = true;
            const result = await fn();
            await this.run("COMMIT;");
            return result;
        } catch (e) {
            if (beginTransaction) await this.run("ROLLBACK;");
            throw e;
        } finally {
            // 释放事务锁
            nextResolve();
        }
    }
}




class Model {
    db = null;
    constructor(table, schema, db) {
        this.db = db;
        if (!table) throw new Error("Model name is required");
        if (!schema) throw new Error("Model schema is required");
        if (typeof schema !== "object") throw new Error("Model schema must be an object");
        for (const key in schema) {
            const sc = schema[key];
            let flag = false;
            for (const k in ModelType) {
                const type = ModelType[k];
                if (sc.type !== type.type) continue;
                flag = true;
                break;
            }
            if (!flag) throw new Error(`Model type ${sc.type} is not supported`);
        }
        this.table = table;
        this.schema = schema;
        this.ready = this.#initTable();
    }




    /**
     * 在事务中执行函数
     * @param {function} fn - 需要执行的函数
     * @returns {Promise<void>} - Promise 对象
     * @example
     * await model.runInTransaction(async () => {
     *   // 在事务中执行的逻辑
     * })
     */
    runInTransaction(fn) {
        return this.db.runInTransaction(fn);
    }

    /**
     * 开启事务
     * @returns {Promise<void>}
     *
     * @example
     * await model.beginTransaction()
     */
    beginTransaction() {
        return this.db.run("BEGIN TRANSACTION;");
    }

    /**
     * 提交事务
     * @returns {Promise<void>}
     *
     * @example
     * await model.commit()
     */
    commit() {
        return this.db.run("COMMIT;");
    }

    /**
     * 回滚事务
     * @returns {Promise<void>}
     *
     * @example
     * await model.rollback()
     */
    rollback() {
        return this.db.run("ROLLBACK;");
    }


    /**
   * 初始化数据表（自动建表 + 约束）
   * @private
   * @returns {Promise<void>}
   *
   * @example
   * await model.ready
   */
    /**
     * 初始化数据表（自动建表 + 约束）
     * @private
     * @returns {Promise<void>}
     *
     * @example
     * await model.ready
     */
    async #initTable() {
        if (!this.schema || Object.keys(this.schema).length === 0) return;

        const uniqueGroups = {};
        const cols = [];

        for (const [key, col] of Object.entries(this.schema)) {

            // SQL 类型
            let sql = col.type;
            if (sql === "Boolean") sql = "INTEGER";
            else if (sql === "Date") sql = "TEXT";

            // NOT NULL
            if (col.nullable === false) sql += " NOT NULL";

            // PRIMARY KEY
            if (col.primaryKey) sql += " PRIMARY KEY";

            // AUTOINCREMENT
            if (col.autoIncrement) sql += " AUTOINCREMENT";

            // 单字段 UNIQUE
            if (col.unique) sql += " UNIQUE";

            // DEFAULT
            if (col.default !== undefined) sql += ` DEFAULT ${col.default}`;

            // CHECK
            if (col.check) sql += ` CHECK(${col.check})`;

            cols.push(`${key} ${sql}`.trim());

            // 收集组合 UNIQUE
            if (col.uniqueGroups) {
                for (const g of col.uniqueGroups) {
                    if (!uniqueGroups[g]) uniqueGroups[g] = [];
                    uniqueGroups[g].push(key);
                }
            }
        }

        // 组合 UNIQUE
        for (const group of Object.values(uniqueGroups)) {
            if (group.length > 1) {
                cols.push(`UNIQUE(${group.join(",")})`);
            }
        }

        const createSQL = `CREATE TABLE IF NOT EXISTS ${this.table} (${cols.join(", ")})`;

        await this.db.run(createSQL);

        // 初始化 sqlite_sequence（如果有自增）
        if (Object.values(this.schema).some(c => c.autoIncrement)) {
            await this.db.run(`
      INSERT OR IGNORE INTO sqlite_sequence(name, seq)
      VALUES('${this.table}', 0)
    `);
        }
    }

    // 解析查询 为 SQL
    #parseQuery(query) {
        const params = [];
        const parse = (obj) => {
            const clauses = [];
            for (const key in obj) {
                const value = obj[key];
                // ===== 逻辑操作 =====
                if (Logical[key]) {
                    if (key === "$and" || key === "$or") {
                        if (!Array.isArray(value)) {
                            throw new Error(`${key} value must be an array`);
                        }
                        const parts = value.map(v => `(${parse(v)})`);
                        clauses.push(parts.join(` ${Logical[key]} `));

                    }
                    if (key === "$not") {
                        clauses.push(`NOT (${parse(value)})`);
                    }
                    if (key === "$nor") {
                        if (!Array.isArray(value)) {
                            throw new Error(`$nor value must be an array`);
                        }
                        const parts = value.map(v => `(${parse(v)})`);
                        clauses.push(`NOT (${parts.join(" OR ")})`);
                    }
                    continue;
                }
                // ===== 字段查询 =====
                // 简写： {name:"tom"}
                if (typeof value !== "object" || value === null || Array.isArray(value)) {
                    clauses.push(`${key} = ?`);
                    params.push(value);
                    continue;
                }
                // ===== 多操作符处理 =====
                for (const op in value) {
                    const val = value[op];
                    // ---------- 比较 ----------
                    if (QueryComparison[op]) {
                        const operator = QueryComparison[op];
                        if (op === "$in" || op === "$nin") {
                            const placeholders = val.map(() => "?").join(",");
                            clauses.push(`${key} ${operator} (${placeholders})`);
                            params.push(...val);
                        } else {
                            clauses.push(`${key} ${operator} ?`);
                            params.push(val);
                        }
                        continue;
                    }
                    if (Evaluation[op]) {
                        if (op === "$exists") {
                            clauses.push(`${key} ${val ? "IS NOT NULL" : "IS NULL"}`);
                        } else {
                            let pattern = val;
                            switch (op) {
                                case "$like": pattern = `%${val}%`; break;
                                case "$lLike": pattern = `${val}%`; break;
                                case "$rLike": pattern = `%${val}`; break;
                                case "$nLike": pattern = `%${val}%`; break;
                                case "$nlLike": pattern = `${val}%`; break;
                                case "$nrLike": pattern = `%${val}`; break;
                            }
                            clauses.push(`${key} ${Evaluation[op]} ?`);
                            params.push(pattern);
                        }
                        continue;
                    }
                }
            }
            return clauses.join(" AND ");
        };
        const sql = parse(query);
        return { sql: sql ? `WHERE ${sql}` : "", params };
    }


    /**
     * * 
     * * @param {Object} res - 查询结果
     */

    #normalizeRow(res) {
        for (const [key, typeDef] of Object.entries(this.schema)) {
            if (!res.hasOwnProperty(key) && !(typeDef.autoUpdate || typeDef.autoInsert)) continue;
            if (typeDef.type === "Boolean") {
                res[key] = [true, "1", 1].includes(res[key]) ? 1 : 0;
            } else if (typeDef.type === "Date") {
                if (typeDef.autoInsert && !res[key]) {
                    res[key] = this.#formatDate();
                } if (typeDef.autoUpdate) {
                    res[key] = this.#formatDate();
                }
            }
        }
        return res;
    }


    #formatDate(date = new Date()) {
        const pad = (n) => String(n).padStart(2, '0')
        return (
            date.getFullYear() + '-' +
            pad(date.getMonth() + 1) + '-' +
            pad(date.getDate()) + ' ' +
            pad(date.getHours()) + ':' +
            pad(date.getMinutes()) + ':' +
            pad(date.getSeconds())
        )
    }

    /**
    * 根据 schema 把查询出来的 0/1 字段转回 boolean
    * @param {Object|Array} data - 查询结果，单条或多条
    * @returns {Object|Array} - boolean 字段已转换
    */

    #integerToBoolean(data) {
        const booleanFields = Object.entries(this.schema)
            .filter(([_, def]) => def.type === "Boolean")
            .map(([key]) => key);
        if (Array.isArray(data)) {
            return data.map(row => this.#convertRowBoolean(row, booleanFields));
        } else if (data && typeof data === "object") {
            return this.#convertRowBoolean(data, booleanFields);
        }
        return data;
    }
    // 将查询出来的 0/1 字段转回 boolean    
    #convertRowBoolean(row, booleanFields) {
        const newRow = { ...row };
        for (const key of booleanFields) {
            if (key in newRow) {
                newRow[key] = newRow[key] === 1;
            }
        }
        return newRow;
    }

    // 根据 order 对象生成 ORDER BY 语句
    #parseOrder(order) {
        const orderKeys = Object.keys(order);
        let orderSql = "";

        if (orderKeys.length > 0) {
            const orderParts = orderKeys.map(key => `${key} ${(order[key] || 'asc').toUpperCase()}`);
            orderSql = `ORDER BY ${orderParts.join(", ")}`;
        }
        return orderSql;
    }


    async addColumn(fieldName, fieldDef) {
        // 1. 检查字段是否已存在
        const tableInfo = await this.db.all(`PRAGMA table_info(${this.table})`);
        if (tableInfo.some(col => col.name === fieldName)) {
            throw new Error(`Column "${fieldName}" already exists in table "${this.table}"`);
        }
        // 2. 获取 SQLite 类型和约束
        let typeStr;
        if (typeof fieldDef === "string") {
            typeStr = fieldDef;  // 直接传 SQLite 类型
        } else if (typeof fieldDef === "object") {
            // 兼容你的 schema 定义
            const baseType = fieldDef.type || "TEXT";
            const notNull = fieldDef.notNull ? "NOT NULL" : "";
            const defaultVal = fieldDef.default !== undefined ? `DEFAULT ${fieldDef.default}` : "";
            typeStr = [baseType, notNull, defaultVal].filter(Boolean).join(" ");
        }

        // 3. 执行 ALTER TABLE 增加字段
        const sql = `ALTER TABLE ${this.table} ADD COLUMN ${fieldName} ${typeStr}`;
        await this.db.run(sql);

        // 4. 同步更新 schema
        this.schema[fieldName] = fieldDef;
        return true;
    }

    findOne(query, { fields = ["*"], order = {} } = {}) {
        const { sql, params } = this.#parseQuery(query);
        const querySql = `SELECT ${fields.join(", ")} FROM ${this.table} ${sql} ${this.#parseOrder(order)} LIMIT 1`;
        return this.db.get(querySql, params).then(row => this.#integerToBoolean(row));
    }


    find(query = {}, { fields = ["*"], pageIndex = 1, pageSize = 20, order = {} } = {}) {
        const { sql, params } = this.#parseQuery(query);
        const offset = Math.max(0, (pageIndex - 1) * pageSize);
        let limitSql = "";
        if (pageSize > 0) {
            limitSql = `LIMIT ${offset}, ${pageSize}`;
        }
        const querySql = ` SELECT ${fields.join(", ")} FROM ${this.table}  ${sql}  ${this.#parseOrder(order)}   ${limitSql}`;
        return this.db.all(querySql, params).then(rows => this.#integerToBoolean(rows));
    }



    async insert(insertData) {
        insertData = this.#normalizeRow(insertData);
        // 处理自增列
        Object.entries(this.schema)
            .filter(([k, v]) => v.autoIncrement)
            .forEach(([k]) => delete insertData[k]);
        // 构建 SQL
        const columns = Object.keys(insertData).join(", ");
        const placeholders = Object.keys(insertData).map(() => "?").join(", ");
        const values = Object.values(insertData);
        const result = await this.db.run(`INSERT INTO ${this.table} (${columns}) VALUES (${placeholders})`, values);
        insertData.id = result.lastID;
        return insertData;
    }



    async insertMany(insertDatas) {
        if (!Array.isArray(insertDatas)) throw new Error("insertDatas must be an array");
        if (insertDatas.length === 0) return;

        // 处理自增列 & 填充默认值
        const autoIncFields = Object.entries(this.schema)
            .filter(([k, v]) => v.autoIncrement)
            .map(([k]) => k);

        const preparedData = insertDatas.map(data => {
            const insertData = this.#normalizeRow(data);
            // 删除自增列
            autoIncFields.forEach(f => delete insertData[f]);
            // 填充默认值
            Object.entries(this.schema).forEach(([k, v]) => {
                if (!(k in insertData) && v.default !== undefined) {
                    insertData[k] = v.default;
                }
            });

            return insertData;
        });
        // 构建列名和占位符
        const columns = Object.keys(preparedData[0]).join(", ");
        const placeholders = Object.keys(preparedData[0]).map(() => "?").join(", ");
        // 数据量大于 50 使用预处理语句
        if (preparedData.length > 50) {
            // 使用事务 + 单条预处理
            await this.runInTransaction(async () => {
                const stmt = await this.db.prepare(`INSERT INTO ${this.table} (${columns}) VALUES (${placeholders})`);
                for (const row of preparedData) {
                    await stmt.run(Object.values(row));
                }
                await stmt.finalize();
            })
        } else {
            // 小量直接批量拼接 SQL（安全，因为还是用 ? 占位符）
            const sql = `INSERT INTO ${this.table} (${columns}) VALUES ${preparedData.map(() => `(${placeholders})`).join(", ")}`;
            const params = preparedData.flatMap(Object.values);
            await this.db.run(sql, params);
        }
    }


    deleteOne(query) {
        const { sql, params } = this.#parseQuery(query);
        if (!sql) {
            throw new Error("deleteMany requires query condition");
        }
        return this.db.run(
            `DELETE FROM ${this.table}
         WHERE rowid IN (
            SELECT rowid FROM ${this.table} ${sql} LIMIT 1
         )`,
            params
        );
    }

    deleteMany(query) {
        const { sql, params } = this.#parseQuery(query);
        if (!sql) {
            throw new Error("deleteMany requires query condition");
        }
        return this.db.run(`DELETE FROM ${this.table} ${sql}`, params);
    }

    async updateBranch(branch) {
        if (!Array.isArray(branch) || branch.length === 0) return;
        const keys = Object.keys(branch[0]).filter(k => k !== "id");
        const setSql = keys.map(k => `${k}=?`).join(", ");
        await this.runInTransaction(async () => {
            const stmt = await this.db.prepare(`UPDATE ${this.table} SET ${setSql} WHERE id=?`);
            for (let row of branch) {
                row = this.#normalizeRow(row)
                const params = keys.map(k => row[k]);
                params.push(row.id);
                await stmt.run(params);
            }
            await stmt.finalize();
        })
    }

    async updateBranchDynamic(branch) {
        // branch: [
        //   { query: { id: 1 }, data: { path: "/new/1" } },
        //   { query: { oldName: "abc" }, data: { path: "/new/abc" } }
        // ]
        if (!Array.isArray(branch) || branch.length === 0) return;
        await this.runInTransaction(async () => {
            for (const { query, data } of branch) {
                const { sql: whereSql, params: whereParams } = this.#parseQuery(query);
                const keys = Object.keys(data);
                const setSql = keys.map(k => `${k}=?`).join(", ");
                const values = Object.values(data);
                const sql = `UPDATE ${this.table} SET ${setSql} ${whereSql}`;
                await this.db.run(sql, [...values, ...whereParams]);
            }
        })
    }

    clear() {
        return this.db.run(`DELETE FROM ${this.table}`);
    }


    async upsert(data, conflictKeys = ["id"]) {
        // 先标准化行类型
        const row = this.#normalizeRow({ ...data });
        const keys = Object.keys(row);
        const placeholders = keys.map(() => "?").join(", ");
        const values = Object.values(row);
        const updateKeys = keys.filter(k => !conflictKeys.includes(k));
        let sql = `
        INSERT INTO ${this.table} (${keys.join(",")})
        VALUES (${placeholders})
        ON CONFLICT (${conflictKeys.join(",")})
    `;
        if (updateKeys.length > 0) {
            const updateClause = updateKeys
                .map(k => `${k} = excluded.${k}`)
                .join(", ");
            sql += ` DO UPDATE SET ${updateClause}`;
        } else {
            sql += ` DO NOTHING`;
        }
        const result = await this.db.run(sql, values);
        // 可选：把 lastID 加回 data
        if (result.lastID) row.id = result.lastID;
        return row;
    }

    updateOne(query, updateData) {
        const { sql, params } = this.#parseQuery(query);
        // 不允许更新自增字段
        updateData = this.#normalizeRow(updateData);
        Object.entries(this.schema)
            .filter(([k, v]) => v.autoIncrement)
            .forEach(([k]) => delete updateData[k]);
        const keys = Object.keys(updateData);
        if (!keys.length) {
            throw new Error("updateData empty");
        }

        const setClause = keys.map(k => `${k} = ?`).join(", ");
        const values = keys.map(k => updateData[k]);

        return this.db.run(
            `UPDATE ${this.table}
         SET ${setClause}
         WHERE rowid IN (
             SELECT rowid FROM ${this.table} ${sql} LIMIT 1
         )`,
            [...values, ...params]
        );
    }

    updateMany(query, updateData) {
        const { sql, params } = this.#parseQuery(query);
        // 不允许更新自增字段
        Object.entries(this.schema)
            .filter(([k, v]) => v.autoIncrement)
            .forEach(([k]) => delete updateData[k]);
        const keys = Object.keys(updateData);
        if (!keys.length) throw new Error("updateData empty");
        // 构建 SET 子句
        const setClause = keys.map(k => `${k} = ?`).join(", ");
        const values = keys.map(k => updateData[k]);
        // UPDATE 整个匹配结果
        return this.db.run(
            `UPDATE ${this.table}
         SET ${setClause}
         ${sql}`,
            [...values, ...params]
        );
    }

    count(query = {}) {
        const { sql, params } = this.#parseQuery(query);
        return this.db.get(
            `SELECT COUNT(*) AS count FROM ${this.table} ${sql}`,
            params
        ).then(row => row ? row.count : 0);
    }


    async joinFind({
        fields = ['t1.*'],
        joins = [],           // [{ name: 'other_table', type: 'LEFT', on: 't1.id = t2.user_id' }]
        filters = {},         // Mongo 风格 query 对象
        order = {},           // Mongo 风格 order 对象
        pageIndex = 1,
        pageSize = 20
    } = {}) {

        // 解析 filters 成 SQL 条件
        const { sql: whereSql, params: whereValues } = this.#parseQuery(filters);

        // 构建 join 语句
        let joinSQL = `FROM ${this.table} AS t1`;
        joins.forEach((j, index) => {
            const alias = `t${index + 2}`;
            const type = (j.type || 'INNER JOIN').toUpperCase();
            joinSQL += ` ${type} ${j.name} AS ${alias} ON ${j.on}`;
        });

        // SELECT 主体
        let sql = `SELECT ${fields.join(', ')} ${joinSQL} ${whereSql}`;
        sql += this.#parseOrder(order);
        // 分页处理
        if (pageSize > 0) {
            const offset = (pageIndex - 1) * pageSize;
            sql += ' LIMIT ? OFFSET ?';
            whereValues.push(pageSize, offset);
        }

        return this.db.all(sql, whereValues).then(rows => this.#integerToBoolean(rows))
    }

}


class MongoSqlite {
    #db = null;
    #models = {};
    constructor(dbFile) {
        this.#db = new Database(dbFile);
        this.#models = {};
    }
    /**
     * 获取 Model 对象
     * @param {string} name - 模型名称
     * @param {Schema} schema - 表结构
     * @returns {Model} - Model 对象
     */
    model(name, schema) {
        if (!this.#models[name]) {
            this.#models[name] = new Model(name, schema, this.#db);
        }
        return this.#models[name];
    }

    getTables() {
        const names = [];
        for (const key in this.#models) {
            names.push(this.#models[key].table);
        }
        return names
    }

    getTable(name) {
        return this.#models[name];
    }
}


module.exports = { MongoSqlite, ModelType, QueryComparison, Logical, Evaluation };