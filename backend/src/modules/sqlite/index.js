const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

// =====================
// Schema 类
// =====================
class Schema {
    constructor(definition) {
        this.definition = definition;
    }
}

// =====================
// 主类：SQLiteMongoose
// =====================
class SQLiteMongoose {
    constructor(dbPath = "./data.sqlite") {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        this.db = new Database(dbPath);
        this.models = new Map();

        this.db.pragma("journal_mode = WAL");
    }

    model(name, schema) {
        if (this.models.has(name)) return this.models.get(name);

        const model = new SQLiteModel(this.db, name, schema);
        this.models.set(name, model);
        return model;
    }
}

// =====================
// 单个数据集合 Model
// =====================
class SQLiteModel {
    constructor(db, name, schema) {
        this.db = db;
        this.name = name;
        this.schema = schema;

        this._initTable();
    }

    _initTable() {
        this.db.prepare(`
            CREATE TABLE IF NOT EXISTS ${this.name} (
                _id INTEGER PRIMARY KEY AUTOINCREMENT,
                data TEXT NOT NULL
            )
        `).run();
    }

    // 应用 Schema：默认值 / 类型校验
    _applySchema(doc) {
        const newDoc = { ...doc };
        const def = this.schema.definition;

        for (const key in def) {
            const rule = def[key];

            // 默认值
            if (newDoc[key] === undefined && rule.default !== undefined) {
                newDoc[key] =
                    typeof rule.default === "function"
                        ? rule.default()
                        : rule.default;
            }

            // 类型校验
            if (rule.type && newDoc[key] !== undefined) {
                const expected = rule.type.name.toLowerCase();
                const actual = Array.isArray(newDoc[key])
                    ? "array"
                    : typeof newDoc[key];

                if (expected !== actual) {
                    throw new Error(
                        `Schema type error: field "${key}" expected ${expected}, got ${actual}`
                    );
                }
            }
        }

        return newDoc;
    }

    // =====================
    // 创建文档
    // =====================
    async create(doc) {
        const newDoc = this._applySchema(doc);
        const result = this.db
            .prepare(`INSERT INTO ${this.name} (data) VALUES (?)`)
            .run(JSON.stringify(newDoc));

        return { _id: result.lastInsertRowid, ...newDoc };
    }

    // =====================
    // 查询（链式）
    // =====================
    find(query = {}) {
        return new QueryBuilder(this.db, this.name, query);
    }

    async findOne(query = {}) {
        const qb = new QueryBuilder(this.db, this.name, query);
        const list = await qb.limit(1).exec();
        return list[0] || null;
    }

    // =====================
    // 更新
    // =====================
    async updateOne(filter, update) {
        const list = await this.find(filter).limit(1).exec();
        if (!list.length) return { modifiedCount: 0 };

        const doc = list[0];
        let updated = doc;

        if (update.$set) {
            updated = { ...updated, ...update.$set };
        }

        updated = this._applySchema(updated);

        this.db
            .prepare(`UPDATE ${this.name} SET data=? WHERE _id=?`)
            .run(JSON.stringify(updated), doc._id);

        return { modifiedCount: 1 };
    }

    // =====================
    // 删除
    // =====================
    async deleteOne(filter) {
        const list = await this.find(filter).limit(1).exec();
        if (!list.length) return { deletedCount: 0 };

        const doc = list[0];

        this.db.prepare(`DELETE FROM ${this.name} WHERE _id=?`).run(doc._id);

        return { deletedCount: 1 };
    }
}

// =====================
// QueryBuilder：链式查询
// =====================
class QueryBuilder {
    constructor(db, table, filter) {
        this.db = db;
        this.table = table;
        this.filter = filter;
        this._limit = null;
    }

    limit(n) {
        this._limit = n;
        return this;
    }

    async exec() {
        const rows = this.db.prepare(`SELECT * FROM ${this.table}`).all();

        let docs = rows.map((r) => ({
            _id: r._id,
            ...JSON.parse(r.data),
        }));

        // 过滤
        docs = docs.filter((d) => match(d, this.filter));

        if (this._limit !== null) {
            docs = docs.slice(0, this._limit);
        }

        return docs;
    }
}

// =====================
// 匹配器
// =====================
function match(doc, filter) {
    return Object.keys(filter).every((key) => filter[key] === doc[key]);
}

// =====================
// 导出
// =====================
module.exports = {
    Schema,
    SQLiteMongoose,
};
