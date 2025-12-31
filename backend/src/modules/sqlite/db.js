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

/**
 * 通用 SQLite Model 基类
 * 封装表初始化、CRUD、批量操作、条件构造
 */
class Model {
    /**
     * 创建一个 Model 实例
     * @param {string} table 表名
     * @param {{ definition: object, constraints?: string[] }} schema 表结构定义
     * @param {import('sqlite3').Database} db sqlite 数据库实例
     *
     * @example
     * const userModel = new Model('user', {
     *   definition: {
     *     id: 'INTEGER',
     *     name: 'TEXT',
     *     age: 'INTEGER'
     *   },
     *   constraints: ['UNIQUE(name)']
     * }, db)
     */
    constructor(table, schema, db) {
        this.table = table;
        this.schema = schema.definition;
        this.db = db;
        this.constraints = schema.constraints;
        this.ready = this._initTable();
    }

    /**
     * 初始化数据表（自动建表 + 约束）
     * @private
     * @returns {Promise<void>}
     *
     * @example
     * await model.ready
     */
    async _initTable() {
        const cols = Object.entries(this.schema)
            .map(([key, type]) =>
                key === 'id'
                    ? `${key} INTEGER PRIMARY KEY AUTOINCREMENT`
                    : `${key} ${type}`
            )
            .join(", ");

        let fullDefinition = cols;

        if (this.constraints && this.constraints.length) {
            fullDefinition += ', ' + this.constraints.join(', ');
        }

        await this.db.run(
            `CREATE TABLE IF NOT EXISTS ${this.table} (${fullDefinition})`
        );

        await this.db.run(`
            INSERT OR REPLACE INTO sqlite_sequence(name, seq)
            VALUES('${this.table}', 999)
        `);
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
     * 插入单条数据
     * @param {object} data 数据对象
     * @returns {Promise<object>} 插入后的数据（包含 id）
     *
     * @example
     * const user = await model.insert({ name: 'Tom', age: 18 })
     */
    async insert(data) {
        const keys = Object.keys(data);
        const placeholders = keys.map(() => "?").join(", ");
        const values = Object.values(data);

        const sql = `
            INSERT INTO ${this.table} (${keys.join(",")})
            VALUES (${placeholders})
        `;

        const lastID = await this.db.run(sql, values).then(r => r.lastID);
        return { ...data, id: lastID };
    }

    /**
     * 批量插入底层实现（支持事务）
     * @private
     * @param {Array<object>} datas 数据数组
     * @param {'INSERT' | 'INSERT OR IGNORE'} mode 插入模式
     * @returns {Promise<{changes:number}>}
     *
     * @example
     * await model._insertManyBase([{ name: 'A' }], 'INSERT')
     */
    async _insertManyBase(datas = [], mode = 'INSERT') {
        if (!datas.length) throw new Error("插入数据不能为空");

        const columns = Object.keys(datas[0]);
        const placeholders = columns.map(() => '?').join(', ');

        const sql = `${mode} INTO ${this.table} (${columns.join(', ')}) VALUES (${placeholders})`;

        return new Promise((resolve, reject) => {
            this.db.serialize(async () => {
                let stmt;
                let totalChanges = 0;
                try {
                    await this.beginTransaction();
                    stmt = await this.db.prepare(sql);

                    for (const row of datas) {
                        const values = columns.map(k => row[k]);
                        await new Promise((res, rej) => {
                            stmt.run(values, function (err) {
                                if (err) rej(err);
                                else {
                                    totalChanges += this.changes || 0;
                                    res();
                                }
                            });
                        });
                    }

                    stmt.finalize();
                    await this.commit();
                    resolve({ changes: totalChanges });
                } catch (e) {
                    stmt && stmt.finalize();
                    await this.rollback();
                    reject(e);
                }
            });
        });
    }

    /**
     * 批量插入（重复报错）
     * @param {Array<object>} datas
     * @returns {Promise<{changes:number}>}
     *
     * @example
     * await model.insertMany([{ name: 'A' }, { name: 'B' }])
     */
    insertMany(datas = []) {
        return this._insertManyBase(datas, 'INSERT');
    }

    /**
     * 批量插入（重复忽略）
     * @param {Array<object>} datas
     * @returns {Promise<{changes:number}>}
     *
     * @example
     * await model.insertManyIgnore([{ name: 'A' }])
     */
    insertManyIgnore(datas = []) {
        return this._insertManyBase(datas, 'INSERT OR IGNORE');
    }

    /**
     * 构建 WHERE 条件
     * @private
     * @param {Array<{field:string, op?:string, value:any, logic?:string}>} filters
     * @returns {{ whereSql:string, values:any[] }}
     *
     * @example
     * _buildWhereByFilters([
     *   { field: 'name', op: 'LIKE', value: 'Tom' }
     * ])
     */
    _buildWhereByFilters(filters = []) {
        const conditions = [];
        const values = [];
        filters.forEach((f, i) => {
            const op = (f.op || '=').toUpperCase();
            const logic = (f.logic || 'AND').toUpperCase();
            let val = f.value;
            if (op === 'IN' && Array.isArray(val)) {
                const p = val.map(() => '?').join(', ');
                values.push(...val);
                conditions.push(`${i ? logic : ''} ${f.field} IN (${p})`);
                return;
            }

            values.push(val);
            conditions.push(`${i ? logic : ''} ${f.field} ${op} ?`);
        });

        return {
            whereSql: conditions.length ? 'WHERE ' + conditions.join(' ') : '',
            values
        };
    }

    /**
     * 构建查询字段
     * @private
     * @param {string | string[]} fields
     * @returns {string}
     *
     * @example
     * _buildSelectFields(['id','name'])
     */
    _buildSelectFields(fields = '*') {
        if (Array.isArray(fields)) {
            return fields.map(f => `\`${f}\``).join(', ');
        }
        if (typeof fields === 'string' && fields.trim()) {
            return fields;
        }
        return '*';
    }

    /**
     * 查询单条数据
     * @param {Array<object>} filters
     * @param {{fields?:string|string[]}} options
     * @returns {Promise<object|null>}
     *
     * @example
     * await model.findOne([
     *   { field: 'id', value: 1 }
     * ])
     */
    async findOne(filters = [], options = {}) {
        const selectFields = this._buildSelectFields(options.fields);
        const { whereSql, values } = this._buildWhereByFilters(filters);
        const sql = `
            SELECT ${selectFields}
            FROM ${this.table}
            ${whereSql}
        `;
        return this.db.get(sql, values);
    }

    /**
     * 查询多条数据
     * @param {Array<object>} filters
     * @param {{pageIndex?:number,pageSize?:number,fields?:string|string[]}} options
     * @returns {Promise<Array<object>>}
     *
     * @example
     * await model.find(
     *   [{ field: 'status', value: 1 }],
     *   { pageIndex: 1, pageSize: 10 }
     * )
     */
    async find(filters = [], options = {}) {
        const { pageIndex = 1, pageSize = 20 } = options;
        const selectFields = this._buildSelectFields(options.fields);

        const { whereSql, values } = this._buildWhereByFilters(filters);

        let sql = `SELECT ${selectFields} FROM ${this.table} ${whereSql}`;

        if (pageSize !== -1) {
            sql += ' LIMIT ? OFFSET ?';
            values.push(pageSize, (pageIndex - 1) * pageSize);
        }

        return this.db.all(sql, values);
    }

    /**
     * 清空整张表
     * @returns {Promise<void>}
     *
     * @example
     * await model.clear()
     */
    async clear() {
        return this.db.run(`DELETE FROM ${this.table}`);
    }

    /**
     * 更新数据（简单 where）
     * @param {object} where
     * @param {object} data
     * @returns {Promise<any>}
     *
     * @example
     * await model.update({ id: 1 }, { name: 'Jerry' })
     */
    update(where, data) {
        const filters = Object.entries(where).map(([k, v]) => ({
            field: k,
            value: v
        }));
        return this.updateMany(filters, data);
    }

    /**
     * 批量更新
     * @param {Array<object>} filters
     * @param {object} data
     * @returns {Promise<any>}
     *
     * @example
     * await model.updateMany(
     *   [{ field: 'id', op: 'IN', value: [1,2,3] }],
     *   { status: 1 }
     * )
     */
    async updateMany(filters = [], data) {
        if (!filters.length) throw new Error('filters 不能为空');
        if (!Object.keys(data).length) throw new Error('data 不能为空');

        const setClause = Object.keys(data).map(k => `${k}=?`).join(', ');
        const setValues = Object.values(data);

        const { whereSql, values } = this._buildWhereByFilters(filters);

        const sql = `
            UPDATE ${this.table}
            SET ${setClause}
            ${whereSql}
        `;

        return this.db.run(sql, [...setValues, ...values]);
    }

    /**
     * 批量更新（安全版本）
     * @param {Array<object>} batch 
     *  - filters: [{ field: 'id', value: 1 }, { field: 'isFolder', value: 1 }]
     *  - data: { status: 3, name: '文件A' }
     * @returns {Promise<any>}
     * 
     * @example
     * await updateManyBatchSafe([
        { 
          filters: [{ field: 'id', value: 1 }], 
          data: { status: 3, name: '文件A' } 
        },
        { 
          filters: [{ field: 'id', value: 2 }, { field: 'isFolder', value: 1 }], 
          data: { status: 4 } 
        }
      ]);
     */

    async updateManyBatchIn(batch = []) {
        if (!batch.length) throw new Error('batch 不能为空');
        // 收集所有更新字段
        const allFields = Array.from(new Set(batch.flatMap(item => Object.keys(item.data))));
        // 生成临时数据表
        // 这里用 VALUES 拼接占位符，批量插入
        let valuesSql = [];
        const values = [];
        batch.forEach(item => {
            const row = [];
            allFields.forEach(f => {
                if (item.data[f] !== undefined) {
                    row.push('?');
                    values.push(item.data[f]);
                } else {
                    row.push('NULL'); // 没有更新的字段填 NULL
                }
            });
            // 拼 filters 为一个额外的列，用 JSON 或组合 key
            const filterKey = item.filters.map(f => f.value).join(',');
            row.push('?');
            values.push(filterKey);
            valuesSql.push(`(${row.join(',')})`);
        });
        // 拼临时表列名
        const tempCols = [...allFields, 'filterKey'];
        const sql = `
    UPDATE ${this.table} t
    JOIN (
      VALUES ${valuesSql.join(',')}
    ) AS tmp(${tempCols.join(',')})
    ON CONCAT(${batch[0].filters.map(f => `t.${f.field}`).join(",') , ',' ,(")}) = tmp.filterKey
    SET ${allFields.map(f => `t.${f} = COALESCE(tmp.${f}, t.${f})`).join(', ')}
  `;

        return this.db.run(sql, values);
    }


    /**
     * 删除单条
     * @param {object} where
     * @returns {Promise<any>}
     *
     * @example
     * await model.deleteOne({ id: 1 })
     */
    async deleteOne(where) {
        const keys = Object.keys(where);
        if (!keys.length) throw new Error('条件不能为空');

        const sql = `
            DELETE FROM ${this.table}
            WHERE ${keys.map(k => `${k}=?`).join(' AND ')}
        `;

        return this.db.run(sql, Object.values(where));
    }

    /**
    * 执行链表查询 (JOIN) 并支持筛选和分页。
    *
    * @param {Object} options
    * @param {Array<string>} [options.fields=['t1.*']] - 要查询的字段数组，支持表别名，如 ['t1.id', 't2.name']。
    * @param {Array<Object>} [options.joins=[]] - 表连接定义数组，每个对象格式：
    *   { name: 'tableName', type: 'INNER|LEFT|RIGHT', on: 't1.id = t2.refId' }
    * @param {Array<Object>} [options.filters=[]] - 筛选条件数组，格式同 find：
    *   [{ field, value, op = '=', logic = 'AND' }]
    * @param {number} [options.pageIndex=1] - 页码，从 1 开始。
    * @param {number} [options.pageSize=20] - 每页条数，-1 表示不分页。
    * @returns {Promise<Array<Object>>} 查询结果数组。
    *
    * @example
    * // 查询用户及其角色信息
    * const result = await User.joinFind({
    *   fields: ['t1.id', 't1.username', 't2.roleName'],
    *   joins: [
    *     { name: 'roles', type: 'LEFT JOIN', on: 't1.roleId = t2.id' }
    *   ],
    *   filters: [
    *     { field: 't1.status', value: 1 },
    *     { field: 't2.isActive', value: 1 }
    *   ],
    *   pageIndex: 1,
    *   pageSize: 10
    * });
    */
    async joinFind({
        fields = ['t1.*'],
        joins = [],
        filters = [],
        pageIndex = 1,
        pageSize = 20
    } = {}) {

        const { whereSql, values: whereValues } =
            this._buildWhereByFilters(filters);

        let joinSQL = `FROM ${this.table} AS t1`;

        joins.forEach((j, index) => {
            const alias = `t${index + 2}`;
            const type = (j.type || 'INNER JOIN').toUpperCase();
            joinSQL += ` ${type} ${j.name} AS ${alias} ON ${j.on}`;
        });

        let sql = `
    SELECT ${fields.join(', ')}
    ${joinSQL}
    ${whereSql}
    `;

        if (pageSize !== -1) {
            const offset = (pageIndex - 1) * pageSize;
            sql += ' LIMIT ? OFFSET ?';
            whereValues.push(pageSize, offset);
        }

        return this.db.all(sql, whereValues);
    }

    /**
     * 批量删除
     * @param {Array<object>} filters
     * @returns {Promise<any>}
     *
     * @example
     * await model.deleteMany([
     *   { field: 'status', value: 0 }
     * ])
     */
    async deleteMany(filters = []) {
        if (!filters.length) throw new Error('filters 不能为空');

        const { whereSql, values } = this._buildWhereByFilters(filters);
        return this.db.run(`DELETE FROM ${this.table} ${whereSql}`, values);
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