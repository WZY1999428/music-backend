// 假设这是你的 db 实例和 Database/Schema 引用
const MongoSqlite = require("./db");
const path = require('path');
const db = new MongoSqlite(path.resolve("", process.env.SQLITE_DB_PATH));

// ----------------------------------------------------------------------
// 1. 🥇 用户模型 (User Model)
// 存储唯一的管理员账户信息和容量
// ----------------------------------------------------------------------
const User =  db.model("users", db.Schema({
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    username: "TEXT NOT NULL UNIQUE", // 唯一管理员账户名
    password: "TEXT NOT NULL",         // 密码哈希值 
    createdAt: "DATETIME DEFAULT CURRENT_TIMESTAMP"
}));

// ----------------------------------------------------------------------
// 2. 🥈 文件/文件夹模型 (File Model)
// 统一管理所有文件、文件夹及回收站（软删除）
// 注意windows的ino可能会随着文件移动而改变
// ----------------------------------------------------------------------
const FileTable = db.model("files", db.Schema({
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    name: "TEXT NOT NULL",
    ino: "INTEGER NOT NULL UNIQUE", // 文件 inode
    isFolder: "INTEGER NOT NULL DEFAULT 0", // 0=文件, 1=文件夹 
    parentId: "INTEGER NOT NULL DEFAULT 0", // 父目录ID (0为根目录)
    fullPathId: "TEXT NOT NULL", // 全路径ID
    size: "INTEGER NOT NULL DEFAULT 0",
    category: "TEXT", // 文件类别：image, video, document, archive, other
    mimeType: "TEXT",       // ← 文件内容真实类型
    extension: "TEXT",      // ← 文件后缀（含 or 不含 . 均可）
    hash: "TEXT", // 文件内容的唯一哈希值（用于秒传/去重）
    path: "TEXT UNIQUE ", // 服务器存储路径
    rootPath: "TEXT NOT NULL", // 根目录路径
    createdAt: "DATETIME DEFAULT CURRENT_TIMESTAMP",
    updatedAt: "DATETIME DEFAULT CURRENT_TIMESTAMP",
    status: "INTEGER NOT NULL DEFAULT 0" // 0: 正常；1: 在回收站中 2：移动文件，重命名文件标记  3.你想表示“父级删除但子目录在回收站，需要隐藏”的状态
}));


// ----------------------------------------------------------------------
// 3. 🔑 会话令牌模型 (Token Model)
// 用于登录状态维持和 "记住我" 功能
// ----------------------------------------------------------------------
const Token =  db.model("tokens", db.Schema({
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    token: "TEXT NOT NULL UNIQUE",
    userId: "INTEGER NOT NULL", // 关联到 users.id
    expiresAt: "INTEGER NOT NULL", // 令牌失效时间
    enabled: "INTEGER NOT NULL DEFAULT 1",  // 0=禁用, 1=启用
    createdAt: "DATETIME DEFAULT CURRENT_TIMESTAMP"
}));


// ----------------------------------------------------------------------
// 4. ⚙️ 系统配置模型 (Setting Model)
// 用于存储 Key-Value 形式的全局系统配置
// ----------------------------------------------------------------------
const Setting = db.model("settings", db.Schema({
    keyName: "TEXT PRIMARY KEY NOT NULL", // e.g., 'system_version', 'default_limit'
    value: "TEXT",
    description: "TEXT",
    updatedAt: "DATETIME DEFAULT CURRENT_TIMESTAMP"
}));


// ----------------------------------------------------------------------
// 5. ☁️ 上传任务模型 (Upload Model)
// 用于管理大文件的分块上传和断点续传状态
// ----------------------------------------------------------------------
const Upload = db.model("uploads", db.Schema({
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    fileHash: "TEXT NOT NULL",
    fileName: "TEXT NOT NULL",
    totalChunks: "INTEGER NOT NULL",
    uploadedChunks: "TEXT NOT NULL", // JSON string of uploaded chunk indexes
    tempPath: "TEXT NOT NULL", // 服务器存储临时块的目录
    userId: "INTEGER NOT NULL",
    expiresAt: "DATETIME NOT NULL" // 临时记录的失效时间
}));


// ----------------------------------------------------------------------
// 6. ⭐️ 我的收藏模型 (Favorite Model)
// 存储用户和文件之间的收藏关系
// ----------------------------------------------------------------------
const Favorite = db.model("favorites", db.Schema({
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    userId: "INTEGER NOT NULL", // 关联到 users.id
    fileId: "INTEGER NOT NULL ", // 关联到 files.id
    createdAt: "DATETIME DEFAULT CURRENT_TIMESTAMP",
}, {
    constraints: ["UNIQUE (userId, fileId)"]
}));

// 导出所有模型供其他模块使用
module.exports = { User, FileTable, Token, Setting, Upload, Favorite };