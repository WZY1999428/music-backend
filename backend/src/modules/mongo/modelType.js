/**
 * ModelType: 定义 SQL 字段类型映射
 * 模仿 Mongoose.Schema.Types 的设计
 * 针对 SQLite 优化的字段类型映射
 */
const ModelType = {
    // 文本类型
    String: { type: "TEXT", nullable: true },
    Text: { type: "TEXT", nullable: true },
    // 数值类型
    Integer: { type: "INTEGER", nullable: true },
    Int: { type: "INTEGER", nullable: true },
    Boolean: { type: "Boolean", nullable: true }, // SQLite 无布尔，用 0/1

    // 浮点数类型
    Float: { type: "REAL", nullable: true },
    Double: { type: "REAL", nullable: true },
    Real: { type: "REAL", nullable: true },

    // 日期类型
    Date: { type: "Date", nullable: true, autoUpdate: false, autoInsert: true },

    // 二进制
    Blob: { type: "BLOB", nullable: true },

    // 特殊：主键自增（不可为空）
    Id: { type: "INTEGER", nullable: false, primaryKey: true, autoIncrement: true }
};

module.exports = ModelType;