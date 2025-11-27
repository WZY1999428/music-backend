const sqlite3 = require('sqlite3').verbose();
const path = require('path');
class Database {
    /**
     * @constructor
     * @param {string} dbFile - 数据库文件路径
     */
    constructor(dbFile = path.resolve("", "app.db")) {
        this.db = new sqlite3.Database(dbFile);
    }

    /**
     * @description 运行 SQL 语句
     * @param {string} sql - SQL 语句
     * @param {array} params - SQL 语句参数
     * @return {Promise} - Promise 对象
     */
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve(null);
            });
        });
    }

    /**
     * @description 获取单个数据
     * @param {string} sql - SQL 语句
     * @param {array} params - SQL 语句参数
     * @return {Promise} - Promise 对象
     */
    _get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row ? Database.parseJSON(row) : null);
            });
        });
    }

    /**
     * @description 创建表
     * @param {string} table - 表名
     * @param {object} tableSchema - 表结构
     * @param {array} foreignKeys - 外键
     * @return {Promise} - Promise 对象
     */
    create(table, tableSchema = {}, foreignKeys = []) {
        return new Promise((resolve, reject) => {
            const cols = Object.entries(tableSchema).map(([key, type]) => `${key} ${type}`).join(", ");
            const fks = foreignKeys.length > 0 ? `, ${foreignKeys.join(", ")}` : "";
            const sql = `CREATE TABLE IF NOT EXISTS ${table} (${cols}${fks})`;
            this.db.run(sql, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    }

    /**
     * @description 获取所有数据
     * @param {string} sql - SQL 语句
     * @param {array} params - SQL 语句参数
     * @return {Promise} - Promise 对象
     */
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows.map(Database.parseJSON));
            });
        });
    }

    /**
     * @description 插入数据
     * @param {string} table - 表名
     * @param {object} data - 数据
     * @return {Promise} - Promise 对象
     */
    async insert(table, data) {
        const keys = Object.keys(data);
        const values = Object.values(data).map(Database.stringifyIfObject);
        const placeholders = keys.map(() => "?").join(",");
        const sql = `INSERT INTO ${table} (${keys.join(",")}) VALUES (${placeholders})`;
        return await this.run(sql, values);
    }

    /**
     * @description 查询单个数据
     * @param {string} table - 表名
     * @param {object} where - 查询条件
     * @return {Promise} - Promise 对象
     */
    async findOne(table, where = {}) {
        const keys = Object.keys(where);
        const values = Object.values(where).map(Database.stringifyIfObject);
        const condition = keys.map((k) => `${k}=?`).join(" AND ");
        const sql = `SELECT * FROM ${table} ${keys.length ? "WHERE " + condition : ""}`;
        return await this._get(sql, values);
    }

    /**
     * @description 分页查询数据
     * @param {string} table - 表名
     * @param {object} where - 查询条件
     * @param {number} pageIndex - 页码
     * @param {number} pageSize - 页大小
     * @return {Promise} - Promise 对象
     */
    async find(
        table, where = {}, pageIndex = 1, pageSize = 20) {
        const keys = Object.keys(where);
        const values = Object.values(where).map(Database.stringifyIfObject);
        const condition = keys.map((k) => `${k}=?`).join(" AND ");
        const offset = (pageIndex - 1) * pageSize;
        const sql = `
        SELECT * FROM ${table} 
        ${keys.length ? "WHERE " + condition : ""} 
        LIMIT ? OFFSET ?
        `;
        // 在 values 里加上 limit 和 offset
        return await this.all(sql, [...values, pageSize, offset]);
    }

    /**
     * @description 查询所有数据
     * @param {string} table - 表名
     * @return {Promise} - Promise 对象
     */
    async findAll(table) {
        return await this.all(`SELECT * FROM ${table}`);
    }

    /**
     * @description 更新数据
     * @param {string} table - 表名
     * @param {object} data - 数据
     * @param {object} where - 查询条件
     * @return {Promise} - Promise 对象
     */
    async update(table, data, where) {
        const keys = Object.keys(data);
        const values = Object.values(data).map(Database.stringifyIfObject);
        const setClause = keys.map((k) => `${k}=?`).join(",");

        const whereKeys = Object.keys(where);
        const whereValues = Object.values(where).map(Database.stringifyIfObject);
        const condition = whereKeys.map((k) => `${k}=?`).join(" AND ");

        const sql = `UPDATE ${table} SET ${setClause} WHERE ${condition}`;
        return await this.run(sql, [...values, ...whereValues]);
    }

    /**
     * @description 删除数据
     * @param {string} table - 表名
     * @param {object} where - 查询条件
     * @return {Promise} - Promise 对象
     */
    async delete(table, where) {
        const keys = Object.keys(where);
        const values = Object.values(where).map(Database.stringifyIfObject);
        const condition = keys.map((k) => `${k}=?`).join(" AND ");
        const sql = `DELETE FROM ${table} WHERE ${condition}`;
        return await this.run(sql, values);
    }

    // ======= 辅助函数 =======
    static stringifyIfObject(val) {
        if (typeof val === "object" && val !== null) return JSON.stringify(val);
        return val;
    }

    static parseJSON(row) {
        const parsed = {};
        for (const key in row) {
            const value = row[key];
            if (typeof value === "string") {
                try {
                    parsed[key] = JSON.parse(value);
                } catch {
                    parsed[key] = value;
                }
            } else {
                parsed[key] = value;
            }
        }
        return parsed;
    }
}

module.exports = Database;  
