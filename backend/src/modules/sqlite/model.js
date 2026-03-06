// 假设这是你的 db 实例和 Database/Schema 引用
const { hash } = require("crypto");
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
    ino: "INTEGER NOT NULL UNIQUE",
    isFolder: "INTEGER NOT NULL DEFAULT 0",
    parentId: "INTEGER NOT NULL DEFAULT 0",
    size: "INTEGER NOT NULL DEFAULT 0",
    category: "TEXT",
    mimeType: "TEXT",
    extension: "TEXT",
    hash: "TEXT",
    path: "TEXT UNIQUE",
    rootPath: "TEXT NOT NULL",
    createdAt: "DATETIME DEFAULT CURRENT_TIMESTAMP",
    updatedAt: "DATETIME DEFAULT CURRENT_TIMESTAMP",
    // 状态
    // 0 = 正常
    // 1 = 回收站
    // 2 = 移动/重命名处理中
    // 3 = 父级删除但子目录需隐藏
    status: "INTEGER NOT NULL DEFAULT 0"

}));


// ----------------------------------------------------------------------
// 🥇 文件目录闭包表 (Closure Table)
// 用于快速查询目录树结构
// ----------------------------------------------------------------------
const FilePathTable = db.model("filePaths", db.Schema({
    // 祖先节点 没有父节点插入自己
    ancestor_id: "INTEGER NOT NULL",
    // 当前节点
    descendant_id: "INTEGER NOT NULL",
    // 层级深度 如：
    // 0 = 父级
    // 1 = 子级
    // 2 = 孙子级
    // 3+ = 更深层级
    depth: "INTEGER NOT NULL"

}, { constraints: ["UNIQUE (ancestor_id, descendant_id)"] }));


// ----------------------------------------------------------------------
// 3. 🔑 会话令牌模型 (Token Model)
// 用于登录状态维持和 "记住我" 功能
// ----------------------------------------------------------------------
const Token = db.model("tokens", db.Schema({
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
const UploadRecord = db.model("uploadRecord", db.Schema({
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    userId: "INTEGER NOT NULL", // 关联到 users.id
    hash: "TEXT NOT NULL",
    chunkHash: "TEXT NOT NULL",
    chunkIndex: "INTEGER NOT NULL",
    parentId: "TEXT NOT NULL",
    tempPath: "TEXT NOT NULL",
    filename: "TEXT NOT NULL",
    relativePath: "TEXT",
    createdAt: "DATETIME DEFAULT CURRENT_TIMESTAMP",
}, { constraints: ["UNIQUE (hash, chunkHash)"] }));




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


// ----------------------------------------------------------------------
// 7. 最近访问模型
// 存储用户和文件之间的收藏关系
// ----------------------------------------------------------------------
const RecentFiles = db.model("recentFiles", db.Schema({
    id: "INTEGER PRIMARY KEY AUTOINCREMENT",
    userId: "INTEGER NOT NULL", // 关联到 users.id
    fileId: "INTEGER NOT NULL ", // 关联到 files.id
    createdAt: "DATETIME DEFAULT CURRENT_TIMESTAMP",

}, { constraints: ["UNIQUE (userId, fileId)"] }
));



// 导出所有模型供其他模块使用
module.exports = { User, FileTable, Token, Setting, Favorite, RecentFiles, UploadRecord, FilePathTable };