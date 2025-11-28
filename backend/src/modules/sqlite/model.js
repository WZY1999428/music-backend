// 假设这是你的 db 实例和 Database/Schema 引用
const MongoSqlite = require("./db");
const path = require('path');
const db = new MongoSqlite(path.resolve("", process.env.SQLITE_DB_PATH));

// ----------------------------------------------------------------------
// 1. 🥇 用户模型 (User Model)
// 存储唯一的管理员账户信息和容量
// ----------------------------------------------------------------------
const User = db.model("users", db.Schema({
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    username: "TEXT NOT NULL UNIQUE", // 唯一管理员账户名
    password: "TEXT NOT NULL",         // 密码哈希值
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP"
}));


// ----------------------------------------------------------------------
// 2. 🥈 文件/文件夹模型 (File Model)
// 统一管理所有文件、文件夹及回收站（软删除）
// ----------------------------------------------------------------------
const File = db.model("files", db.Schema({
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    name: "TEXT NOT NULL",
    is_folder: "INTEGER NOT NULL", // 0=文件, 1=文件夹
    parent_id: "INTEGER NOT NULL DEFAULT 0", // 父目录ID (0为根目录)
    size: "INTEGER NOT NULL DEFAULT 0",
    hash: "TEXT", // 文件内容的唯一哈希值（用于秒传/去重）
    path_on_disk: "TEXT", // 服务器存储路径
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
    updated_at: "DATETIME DEFAULT CURRENT_TIMESTAMP",
    deleted_at: "DATETIME" // NULL: 正常；NOT NULL: 在回收站中
}));


// ----------------------------------------------------------------------
// 3. 🔑 会话令牌模型 (Token Model)
// 用于登录状态维持和 "记住我" 功能
// ----------------------------------------------------------------------
const Token = db.model("tokens", db.Schema({
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    token: "TEXT NOT NULL UNIQUE",
    user_id: "INTEGER NOT NULL", // 关联到 users.id
    expires_at: "DATETIME NOT NULL", // 令牌失效时间
    created_at: "DATETIME DEFAULT CURRENT_TIMESTAMP"
}));


// ----------------------------------------------------------------------
// 4. ⚙️ 系统配置模型 (Setting Model)
// 用于存储 Key-Value 形式的全局系统配置
// ----------------------------------------------------------------------
const Setting = db.model("settings", db.Schema({
    key_name: "TEXT PRIMARY KEY NOT NULL", // e.g., 'system_version', 'default_limit'
    value: "TEXT",
    description: "TEXT",
    updated_at: "DATETIME DEFAULT CURRENT_TIMESTAMP"
}));


// ----------------------------------------------------------------------
// 5. ☁️ 上传任务模型 (Upload Model)
// 用于管理大文件的分块上传和断点续传状态
// ----------------------------------------------------------------------
const Upload = db.model("uploads", db.Schema({
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    file_hash: "TEXT NOT NULL",
    file_name: "TEXT NOT NULL",
    total_chunks: "INTEGER NOT NULL",
    uploaded_chunks: "TEXT NOT NULL", // JSON string of uploaded chunk indexes
    temp_path: "TEXT NOT NULL", // 服务器存储临时块的目录
    user_id: "INTEGER NOT NULL",
    expires_at: "DATETIME NOT NULL" // 临时记录的失效时间
}));


// 导出所有模型供其他模块使用
module.exports = { User, File, Token, Setting, Upload };