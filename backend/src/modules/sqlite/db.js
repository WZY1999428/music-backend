/**
 * Database：底层驱动
 * ============================
 * @class Database
 * @description
 *  Database 的底层驱动，使用 sqlite3
 *  通过 Promise 来处理异步
 * @constructor
 * @param {string} dbFile - 数据库文件路径
 */

const sqlite3 = require("sqlite3");
const path = require("path");

class Database {
    constructor(dbFile = path.resolve("", "app.db")) {
        this.db = new sqlite3.Database(dbFile);
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
 * Schema：仅用于定义结构
 * ============================
 * @class Schema
 * @description
 *  Schema 用于定义表结构
 * @constructor
 * @param {object} definition - 结构定义对象
 */
class Schema {
    constructor(definition) {
        this.definition = definition;
    }
}

/**
 * Model：负责 CRUD
 * ============================
 * @class Model
 * @description
 *  Model 负责 CRUD 操作
 * @constructor
 * @param {string} table - 表名
 * @param {Schema} schema - 表结构
 * @param {Database} db - 底层驱动
 */
class Model {
    constructor(table, schema, db) {
        this.table = table;
        this.schema = schema.definition;
        this.db = db;

        this._initTable();
    }

    /**
     * 表初始化 (自动建表)
     * @private
     * @returns {Promise} - Promise 对象
     */
    async _initTable() {
        const cols = Object.entries(this.schema)
            .map(([key, type]) => key === 'id'
                ? `${key} INTEGER PRIMARY KEY AUTOINCREMENT`
                : `${key} ${type}`)
            .join(", ");
        // 创建表
        await this.db.run(`CREATE TABLE IF NOT EXISTS ${this.table} (${cols})`);
        // 设置自增起始值为 1000
        await this.db.run(`
        INSERT OR REPLACE INTO sqlite_sequence(name, seq) VALUES('${this.table}', 999)
    `);
    }



    // ======= 事务方法 =======
    /**
     * 开始事务
     *  @returns {Promise} - Promise 对象
     */
    beginTransaction() {
        return this.db.run("BEGIN TRANSACTION;");
    }

    /**
     * 提交事务
     * @returns {Promise} - Promise 对象
     */
    commit() {
        return this.db.run("COMMIT;");
    }

    /**
     * 回滚事务
     * @returns {Promise} - Promise 对象
     */
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
     * 查询单条数据
     * @param {object} where - 条件对象
     * @returns {Promise} - Promise 对象
     */
    async findOne(where = {}, op = 'AND') {
        const keys = Object.keys(where);
        op = op.trim().toUpperCase();
        const condition = keys.map(k => `${k}=?`).join(["ADN", "OR"].includes(op) ? ` ${op} ` : " AND ");
        const values = Object.values(where);
        const sql = `SELECT * FROM ${this.table} ${condition ? "WHERE " + condition : ""}`;
        return await this.db.get(sql, values);
    }

    /**
     * 查询多条数据
     * @param {array} filters - 条件数组 [{ field, value, op = '=', logic = 'AND' }]
     * @param {number} pageIndex - 页码，从 1 开始
     * @param {number} pageSize - 每页条数
     * @returns {Promise} - Promise 对象
     *await User.find([
        { field: 'age', value: 18, op: '>=' },
        { field: 'username', value: '小吴', op: 'LIKE', logic: 'AND' },
        { field: 'id', value: [1,2,3], op: 'IN', logic: 'OR' }
        ], 1, 20);
     */
    async find(filters = [], pageIndex = 1, pageSize = 20) {
        const conditions = [];
        const values = [];
        filters.forEach((f, i) => {
            const op = (f.op || '=').toUpperCase();
            let val = f.value;
            if (op === 'LIKE') val = `%${val}%`;
            if (op === 'IN' && Array.isArray(val)) {
                const placeholders = val.map(() => '?').join(', ');
                values.push(...val);
                conditions.push(`${f.field} IN (${placeholders})`);
                return;
            }
            values.push(val);
            if (i === 0) {
                // 第一个条件不需要逻辑符
                conditions.push(`${f.field} ${op} ?`);
            } else {
                conditions.push(`${f.logic || 'AND'} ${f.field} ${op} ?`);
            }
        });

        const whereClause = conditions.length ? 'WHERE ' + conditions.join(' ') : '';
        const offset = (pageIndex - 1) * pageSize;
        const sql = `SELECT * FROM ${this.table} ${whereClause} LIMIT ? OFFSET ?`;
        return await this.db.all(sql, [...values, pageSize, offset]);
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

    async deleteOne(where) {
        const keys = Object.keys(where);
        if (!keys.length) throw new Error("deleteOne: 条件不能为空");
        const condition = keys.map(k => `${k}=?`).join(" AND ");
        const values = Object.values(where);
        const sql = `DELETE FROM ${this.table} WHERE ${condition} LIMIT 1`;
        return await this.db.run(sql, values);
    }

    // -------------------- 删除多条 --------------------
    async deleteMany(where) {
        const keys = Object.keys(where);
        if (!keys.length) throw new Error("deleteMany: 条件不能为空");

        const values = [];
        const conditions = keys.map(key => {
            if (Array.isArray(where[key])) {
                values.push(...where[key]);
                return `${key} IN (${where[key].map(() => '?').join(',')})`;
            } else {
                values.push(where[key]);
                return `${key}=?`;
            }
        });

        const sql = `DELETE FROM ${this.table} WHERE ${conditions.join(' AND ')}`;
        return await this.db.run(sql, values);
    }
}

/**
 * 对外暴露的效果：mongoose 的 API
 * ============================
 * @class MongoSqlite
 * @description
 *  对外暴露的效果：mongoose 的 API
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
    model(name, schema) {
        if (!this.models[name]) {
            this.models[name] = new Model(name, schema, this.db);
        }
        return this.models[name];
    }

    /**
     * 获取 Schema 对象
     * @param {object} definition - 结构定义对象
     * @returns {Schema} - Schema 对象
     */
    Schema(def) {
        return new Schema(def);
    }
}


module.exports = MongoSqlite;