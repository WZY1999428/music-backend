/**
 * Database：底层驱动
 * ============================
 * @class Database
 * @description
 * Database 的底层驱动，使用 sqlite3
 * 通过 Promise 来处理异步
 * @constructor
 * @param {string} dbFile - 数据库文件路径
 */

const sqlite3 = require("sqlite3");
const path = require("path");

class Database {
    constructor(dbFile = path.resolve("", "app.db")) {
        this.db = new sqlite3.Database(dbFile);
        this.db.run(`PRAGMA journal_mode = WAL;`);
        this.db.run(`PRAGMA busy_timeout = 3000;`);
    }

    /**
     * 执行 SQL 语句
     * @param {string} sql - SQL 语句
     * @param {array} params - 参数数组
     * @returns {Promise} - Promise 对象
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }

    /**
     * 查询单条数据
     * @param {string} sql - SQL 语句
     * @param {array} params - 参数数组
     * @returns {Promise} - Promise 对象
     */
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }

    serialize(cb) {
        return this.db.serialize(cb);
    }

    /**
     * 【修正】准备预处理语句 (Promisified)
     * @param {string} sql - SQL 语句
     * @returns {Promise<sqlite3.Statement>} - Statement 对象
     */
    prepare(sql) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(sql, (err) => {
                if (err) reject(err);
                else resolve(stmt); // Resolve with the Statement object
            });
        });
    }

    /**
     * 查询多条数据
     * @param {string} sql - SQL 语句
     * @param {array} params - 参数数组
     * @returns {Promise} - Promise 对象
     */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

/**
 * Schema：仅用于定义结构 (支持复合约束)
 * @constructor
 * @param {object} definition - 结构定义对象
 * @class Schema
 * @param {object} definition - 结构定义对象
 * @param {object} [options={}] - 额外的表选项，如 constraints
 */
class Schema {
    constructor(definition, options = {}) {
        this.definition = definition;
        // 存储额外的约束列表，例如 ["UNIQUE (userId, fileId)"]
        this.constraints = options.constraints || [];
    }
}
// -------------------------------------------------------------------

/**
 * Model：负责 CRUD
 * ============================
 * @class Model
 * @description
 * Model 负责 CRUD 操作
 * @constructor
 * @param {string} table - 表名
 * @param {Schema} schema - 表结构
 * @param {Database} db - 底层驱动
 */

const opMap = {
    $gt: '>',
    $lt: '<',
    $gte: '>=',
    $lte: '<=',
    $ne: '!=',
    $eq: '=',
    $like: 'LIKE'
};

class Model {
    constructor(table, schema, db) {
        this.table = table;
        this.schema = schema.definition;
        this.db = db;
        this.constraints = schema.constraints;
        this.ready = this._initTable();
    }
    /**
     * 表初始化 (自动建表)
     * @private
     * @returns {Promise} - Promise 对象
     */
    async _initTable() {
        // 1. 拼接列定义
        const cols = Object.entries(this.schema)
            .map(([key, type]) => key === 'id'
                ? `${key} INTEGER PRIMARY KEY AUTOINCREMENT`
                : `${key} ${type}`)
            .join(", ");

        // 2. 拼接完整的表定义，包含约束
        let fullDefinition = cols;

        if (this.constraints && this.constraints.length) {
            fullDefinition += ', ' + this.constraints.join(', ');
        }

        // 3. 创建表，使用完整的定义
        await this.db.run(`CREATE TABLE IF NOT EXISTS ${this.table} (${fullDefinition})`);

        // 设置自增起始值
        await this.db.run(`
            INSERT OR REPLACE INTO sqlite_sequence(name, seq) VALUES('${this.table}', 999)
        `);
    }

    // ======= 事务方法 =======
    beginTransaction() {
        return this.db.run("BEGIN TRANSACTION;");
    }

    commit() {
        return this.db.run("COMMIT;");
    }

    rollback() {
        return this.db.run("ROLLBACK;");
    }

    /**
     * 插入数据
     * @param {object} data - 数据对象
     * @returns {Promise} - Promise 对象
     */
    async insert(data) {
        const keys = Object.keys(data);
        const placeholders = keys.map(() => "?").join(", ");
        const values = Object.values(data);

        const sql = `INSERT INTO ${this.table} (${keys.join(",")}) VALUES (${placeholders})`;
        const lastID = await this.db.run(sql, values).then(res => {
            return res.lastID
        })
        return {
            ...data,
            id: lastID
        };
    }

    /**
     * 【重构核心】批量插入的基础方法
     * @param {Array<Object>} datas 要插入的数据对象数组。
     * @param {string} mode - 'INSERT' (默认) 或 'INSERT OR IGNORE' (用于避免重复插入报错)
     * @returns {Promise<Object>} 数据库运行结果，包含实际插入的行数。
     * @throws {Error} 如果 datas 为空或数据对象没有字段。
     */
    async _insertManyBase(datas = [], mode = 'INSERT') {
        if (!Array.isArray(datas) || datas.length === 0) {
            throw new Error("_insertManyBase: 插入数据不能为空");
        }

        const columns = Object.keys(datas[0]);
        if (columns.length === 0) {
            throw new Error("_insertManyBase: 插入数据对象中没有字段");
        }

        const columnNames = columns.join(', ');
        const placeholders = columns.map(() => '?').join(', ');

        // 关键：根据模式选择 SQL 语句
        const singleInsertSql = `${mode} INTO ${this.table} (${columnNames}) VALUES (${placeholders})`;

        return new Promise((resolve, reject) => {
            this.db.serialize(async () => {
                let stmt = null;
                let totalChanges = 0; // 记录实际更改数量
                try {
                    await this.beginTransaction();

                    // 使用 Promise 化的 this.db.prepare
                    stmt = await this.db.prepare(singleInsertSql);

                    for (const data of datas) {
                        const values = columns.map(col => data[col]);

                        // 统一使用 Promise 封装 stmt.run 并追踪 changes
                        await new Promise((res, rej) => {
                            stmt.run(values, function (err) { // 必须使用 function(err) 才能访问 this
                                if (err) rej(err);
                                else {
                                    totalChanges += this.changes || 0; // 累加实际影响的行数！
                                    res();
                                }
                            });
                        });
                    }

                    stmt.finalize();
                    await this.commit();
                    resolve({ changes: totalChanges }); // 返回实际更改数量

                } catch (err) {
                    if (stmt) {
                        stmt.finalize();
                    }
                    await this.rollback();
                    reject(err);
                }
            });
        });
    }

    /**
     * 【新增】批量插入多条数据 (默认模式，遇到重复会抛错)。
     * @param {Array<Object>} datas 要插入的数据对象数组。
     * @returns {Promise<Object>} 数据库运行结果，包含实际插入的行数。
     */
    insertMany(datas = []) {
        return this._insertManyBase(datas, 'INSERT');
    }

    /**
     * 【新增】批量插入多条数据，遇到重复的则忽略 (例如用于收藏夹)。
     * @param {Array<Object>} datas 要插入的数据对象数组。
     * @returns {Promise<Object>} 数据库运行结果，包含实际插入的行数。
     */
    insertManyIgnore(datas = []) {
        return this._insertManyBase(datas, 'INSERT OR IGNORE');
    }


    /**
     * 查询单条数据
     * @param {object} where - 条件对象
     * @returns {Promise} - Promise 对象
     */
    async findOne(where = {}, options) {
        let { op = "AND", fields = '*' } = options ?? {};
        const keys = Object.keys(where);
        op = op.trim().toUpperCase();
        const conditionList = [];
        const values = [];

        // 处理字段选择
        let selectFields = '*';
        if (Array.isArray(fields)) {
            selectFields = fields.map(f => `\`${f}\``).join(', ');
        } else if (typeof fields === 'string' && fields.trim()) {
            selectFields = fields;
        }

        for (const k of keys) {
            const v = where[k];
            if (typeof v === 'object' && v !== null) {
                // operator
                const opKey = Object.keys(v)[0];
                const sqlOp = opMap[opKey];
                conditionList.push(`${k} ${sqlOp} ?`);
                values.push(v[opKey]);
            } else {
                conditionList.push(`${k} = ?`);
                values.push(v);
            }
        }

        const condition = conditionList.join(
            ["AND", "OR"].includes(op) ? ` ${op} ` : " AND "
        );

        const sql = `SELECT ${selectFields} FROM ${this.table} ${condition ? "WHERE " + condition : ""}`;
        return await this.db.get(sql, values);
    }


    /**
     * 查询多条数据
     * @param {array} filters - 条件数组 [{ field, value, op = '=', logic = 'AND' }]
     * @param {number} pageIndex - 页码，从 1 开始
     * @param {number} pageSize - 每页条数
     * @returns {Promise} - Promise 对象
     */
    async find(filters = [], options) {
        const { pageIndex = 1, pageSize = 20, fields = '*' } = options ?? {};
        const conditions = [];
        const values = [];
        // 处理字段选择
        let selectFields = '*';
        if (Array.isArray(fields)) {
            selectFields = fields.map(f => `\`${f}\``).join(', ');
        } else if (typeof fields === 'string' && fields.trim()) {
            selectFields = fields;
        }

        // 处理筛选条件
        filters.forEach((f, i) => {
            const op = (f.op || '=').toUpperCase();
            let val = f.value;

            if (op === 'LIKE') val = `%${val}%`;

            if (op === 'IN' && Array.isArray(val)) {
                const placeholders = val.map(() => '?').join(', ');
                values.push(...val);
                conditions.push(`${i === 0 ? '' : (f.logic || 'AND')} ${f.field} IN (${placeholders})`);
                return;
            }

            values.push(val);
            conditions.push(`${i === 0 ? '' : (f.logic || 'AND')} ${f.field} ${op} ?`);
        });

        const whereClause = conditions.length ? 'WHERE ' + conditions.join(' ') : '';

        // 构造 SQL
        let sql = `SELECT ${selectFields} FROM ${this.table} ${whereClause}`;
        if (pageSize !== -1) {
            const offset = (pageIndex - 1) * pageSize;
            sql += ` LIMIT ? OFFSET ?`;
            values.push(pageSize, offset);
        }

        return await this.db.all(sql, values);
    }



    /**
        * 执行链表查询 (JOIN) 并支持筛选和分页。
        * * @param {Array<Object>} tables - 表连接定义
        * @param {Array<Object>} filters - 筛选条件 (与 find 方法相同)
        * @param {number} pageIndex - 页码
        * @param {number} pageSize - 每页大小
        * @returns {Promise<Array<Object>>} 查询结果
     */
    async joinFind({
        fields = ['t1.*'],   // 要查询的字段
        joins = [],          // join 表信息
        filters = [],        // where 条件
        pageIndex = 1,
        pageSize = 20
    } = {}) {

        // ----------------------------------------------------
        // 1. WHERE 条件
        // ----------------------------------------------------
        const conditions = [];
        const values = [];

        filters.forEach((f, i) => {
            const op = (f.op || '=').toUpperCase();
            let val = f.value;

            if (op === 'LIKE') val = `%${val}%`;

            if (op === 'IN' && Array.isArray(val)) {
                const placeholders = val.map(() => '?').join(', ');
                values.push(...val);
                conditions.push(`${i === 0 ? '' : f.logic || 'AND'} ${f.field} IN (${placeholders})`);
                return;
            }

            values.push(val);
            conditions.push(`${i === 0 ? '' : f.logic || 'AND'} ${f.field} ${op} ?`);
        });

        // 拼接 WHERE
        let whereClause = '';
        if (conditions.length > 0) {
            const first = conditions[0].replace(/^(AND|OR)\s+/i, '');
            const rest = conditions.slice(1).join(' ');
            whereClause = `WHERE ${first} ${rest}`.trim();
        }

        // ----------------------------------------------------
        // 2. JOIN 子句
        // ----------------------------------------------------
        let joinSQL = `FROM ${this.table} AS t1`;

        joins.forEach((j, index) => {
            const alias = `t${index + 2}`;
            const type = j.type ? j.type.toUpperCase() : 'INNER JOIN';

            if (!j.on) {
                throw new Error(`Join '${j.name}' 必须指定 on`);
            }

            joinSQL += `
            ${type} ${j.name} AS ${alias} ON ${j.on}
        `;
        });

        // ----------------------------------------------------
        // 3. SQL 拼接
        // ----------------------------------------------------
        const offset = (pageIndex - 1) * pageSize;
        const sql = `
        SELECT ${fields.join(', ')}
        ${joinSQL}
        ${whereClause}
        LIMIT ? OFFSET ?
    `;
        return await this.db.all(sql, [...values, pageSize, offset]);
    }

    async clear() {
        const sql = `DELETE FROM ${this.table}`;
        return await this.db.run(sql);
    }
    /**
     * 更新数据
     * @param {object} where - 条件对象
     * @param {object} data - 数据对象
     * @returns {Promise} - Promise 对象
     */
    async update(where, data) {
        const setKeys = Object.keys(data);
        const setClause = setKeys.map(k => `${k}=?`).join(", ");
        const whereKeys = Object.keys(where);
        const condition = whereKeys.map(k => `${k}=?`).join(" AND ");
        const values = [...Object.values(data), ...Object.values(where)];
        const sql = `UPDATE ${this.table} SET ${setClause} WHERE ${condition}`;
        return await this.db.run(sql, values);
    }

    /**
         * 【新增】批量更新多条数据 (支持 $in，使用事务和预处理语句)。
         *
         * @param {object} where - 筛选条件对象 (支持 { field: { $in: [val1, val2] }, otherField: 'value' })
         * @param {object} data - 要更新的字段和值 { field: newValue }
         * @param {string} op - 逻辑操作符，用于连接基础条件，例如 'AND' 或 'OR'。
         * @returns {Promise<Object>} 数据库运行结果，包含实际更新的行数。
         *
         * 示例：
         * await Model.updateMany(
         * { id: { $in: [10, 11, 12] }, status: 1 },
         * { isRead: 1, updateTime: Date.now() }
         * );
         */
    async updateMany(where, data, op = 'AND') {
        const whereKeys = Object.keys(where);
        const setKeys = Object.keys(data);
        if (!whereKeys.length) {
            throw new Error("updateMany: 筛选条件 (where) 不能为空");
        }
        if (!setKeys.length) {
            throw new Error("updateMany: 更新数据 (data) 不能为空");
        }

        // --- 1. 构建 SET 子句 ---
        const setClause = setKeys.map(k => `${k} = ?`).join(", ");
        const setDataValues = Object.values(data);
        // 更新语句的值：[...setDataValues, ...baseValues, inValue]

        // --- 2. 解析 WHERE 子句（与 deleteMany 逻辑相同） ---
        const baseConditions = []; // 存放普通条件：field = ? 或 field != ?
        const baseValues = [];     // 存放普通条件的值
        let inField = null;        // 存放 $in 的字段名 (例如 'id')
        let inValues = [];         // 存放 $in 的数组值 (例如 [1, 2, 3])

        for (const key of whereKeys) {
            const cond = where[key];
            if (typeof cond !== "object" || cond === null) {
                baseConditions.push(`${key} = ?`);
                baseValues.push(cond);
                continue;
            }

            if (cond.$not !== undefined) {
                baseConditions.push(`${key} != ?`);
                baseValues.push(cond.$not);
            } else if (cond.$ne !== undefined) {
                baseConditions.push(`${key} != ?`);
                baseValues.push(cond.$ne);
            } else if (Array.isArray(cond.$in)) {
                inField = key; // 找到 $in 字段
                inValues = cond.$in;
            } else {
                throw new Error(`updateMany: 不支持的条件: ${JSON.stringify(cond)}`);
            }
        }

        const baseWhere = baseConditions.length
            ? baseConditions.join(` ${op} `)
            : "1 = 1"; // 没有基础条件，则使用 '1 = 1'

        // --- 3. 执行：普通更新 (没有 $in) ---
        if (!inField) {
            const sql = `UPDATE ${this.table} SET ${setClause} WHERE ${baseWhere}`;
            const values = [...setDataValues, ...baseValues];
            return await this.db.run(sql, values);
        }

        // --- 4. 执行：有 $in 条件（使用事务和预处理语句） ---
        return new Promise((resolve, reject) => {
            this.db.serialize(async () => {
                let stmt = null;
                let totalChanges = 0; // 追踪实际更改数量

                try {
                    await this.beginTransaction();

                    // 拼最终 SQL：WHERE 语句中，inField 的值用 ? 代替
                    const sql = `UPDATE ${this.table} SET ${setClause} WHERE ${baseWhere} ${baseWhere ? op : ""} ${inField} = ?`;

                    // 准备预处理语句
                    stmt = await this.db.prepare(sql);

                    for (const inValue of inValues) {
                        // 每次循环传入的值：[...更新字段的值, ...基础条件的值, 当前 $in 的值]
                        const values = [...setDataValues, ...baseValues, inValue];

                        // 使用 Promise 封装 stmt.run 并追踪 changes
                        await new Promise((res, rej) => {
                            stmt.run(values, function (err) { // 必须用 function 才能访问 this
                                if (err) rej(err);
                                else {
                                    totalChanges += this.changes || 0; // 累加实际影响的行数！
                                    res();
                                }
                            });
                        });
                    }

                    stmt.finalize();
                    await this.commit();
                    resolve({ changes: totalChanges }); // 返回实际更改数量

                } catch (err) {
                    if (stmt) {
                        stmt.finalize();
                    }
                    await this.rollback();
                    reject(err);
                }
            });
        });
    }

    async deleteOne(where) {
        const keys = Object.keys(where);
        if (!keys.length) throw new Error("deleteOne: 条件不能为空");
        const condition = keys.map(k => `${k}=?`).join(" AND ");
        const values = Object.values(where);
        const sql = `DELETE FROM ${this.table} WHERE ${condition}`;
        return await this.db.run(sql, values);
    }

    // -------------------- 删除多条（事务 + prepared statement） --------------------
    /**
     * 【修正版】批量删除多条数据 (统一使用 Promise 封装 stmt.run 并追踪 changes)。
     * @param {*} where 
     * @param {*} op 
     * @returns 
     */
    async deleteMany(where, op = 'AND') {
        const keys = Object.keys(where);
        if (!keys.length) throw new Error("deleteMany: 条件不能为空");

        // 先解析条件（除了 $in）
        const baseConditions = [];
        const baseValues = [];
        let inField = null;
        let inValues = [];

        for (const key of keys) {
            const cond = where[key];

            if (typeof cond !== "object" || cond === null) {
                baseConditions.push(`${key} = ?`);
                baseValues.push(cond);
                continue;
            }

            if (cond.$not !== undefined) {
                baseConditions.push(`${key} != ?`);
                baseValues.push(cond.$not);

            } else if (cond.$ne !== undefined) {
                baseConditions.push(`${key} != ?`);
                baseValues.push(cond.$ne);

            } else if (Array.isArray(cond.$in)) {
                inField = key;
                inValues = cond.$in;

            } else {
                throw new Error(`deleteMany: 不支持的条件: ${JSON.stringify(cond)}`);
            }
        }

        // 基础 WHERE（不含 $in）
        const baseWhere = baseConditions.length
            ? baseConditions.join(` ${op} `)
            : "1 = 1";

        // 如果没有 $in，则普通 delete
        if (!inField) {
            const sql = `DELETE FROM ${this.table} WHERE ${baseWhere}`;
            return await this.db.run(sql, baseValues);
        }

        // 有 $in → 使用事务 + prepared statement
        return new Promise((resolve, reject) => {
            this.db.serialize(async () => {
                let stmt = null;
                let totalChanges = 0; // 追踪实际更改数量
                try {
                    await this.beginTransaction();

                    const sql = `DELETE FROM ${this.table} WHERE ${baseWhere} ${baseWhere ? op : ""} ${inField} = ?`;
                    stmt = await this.db.prepare(sql);

                    for (const val of inValues) {
                        // 修正：统一使用 Promise 封装 stmt.run 并追踪 changes
                        await new Promise((res, rej) => {
                            stmt.run([...baseValues, val], function (err) {
                                if (err) rej(err);
                                else {
                                    totalChanges += this.changes || 0; // 追踪更改
                                    res();
                                }
                            });
                        });
                    }

                    stmt.finalize();
                    await this.commit();
                    resolve({ changes: totalChanges }); // 返回实际更改数量
                } catch (err) {
                    if (stmt) {
                        stmt.finalize();
                    }
                    await this.rollback();
                    reject(err);
                }
            });
        });
    }
}

/**
 * 对外暴露的效果：mongoose 的 API
 * ============================
 * @class MongoSqlite
 * @description
 * 对外暴露的效果：mongoose 的 API
 * @constructor
 * @param {string} dbFile - 数据库文件路径
 */
class MongoSqlite {
    constructor(dbFile) {
        this.db = new Database(dbFile);
        this.models = {};
    }

    /**
     * 获取 Model 对象
     * @param {string} name - 模型名称
     * @param {Schema} schema - 表结构
     * @returns {Model} - Model 对象
     */
    model(name, schema, cb) {
        if (!this.models[name]) {
            this.models[name] = new Model(name, schema, this.db, cb);
        }
        return this.models[name];
    }

    /**
     * 获取 Schema 对象
     * @param {object} definition - 结构定义对象
     * @returns {Schema} - Schema 对象
     */
    Schema(def, options) {
        return new Schema(def, options);
    }
}


module.exports = MongoSqlite;