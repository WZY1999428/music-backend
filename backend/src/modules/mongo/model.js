// 假设这是你的 db 实例和 Database/Schema 引用
const { MongoSqlite, ModelType } = require("./index");
const path = require('path');
const db = new MongoSqlite(path.resolve("", process.env.SQLITE_DB_PATH));
// ----------------------------------------------------------------------
// 1. 🥇 用户模型 (User Model)
// 存储唯一的管理员账户信息和容量
// ----------------------------------------------------------------------

const User = db.model("users", {
    id: ModelType.Id,
    username: { ...ModelType.String, unique: true }, // 唯一管理员账户名
    password: ModelType.String,  /// 密码哈希值 
    createdAt: ModelType.Date
});


// ----------------------------------------------------------------------
// 2. 🔑 会话令牌模型 (Token Model)
// 用于登录状态维持和 "记住我" 功能
// ----------------------------------------------------------------------

const Token = db.model("tokens", {
    Id: ModelType.Id,
    token: { ...ModelType.String, unique: true },
    userId: { ...ModelType.Integer, unique: true },
    expiresAt: { ...ModelType.Integer, unique: true },
    enabled: { ...ModelType.Integer, default: 1 },
    createdAt: ModelType.Date
});


// ----------------------------------------------------------------------
// 3. 🥈 文件/文件夹模型 (File Model)
// 统一管理所有文件、文件夹及回收站（软删除）
// 注意windows的ino可能会随着文件移动而改变
// ----------------------------------------------------------------------

const FileTable = db.model("files", {
    id: ModelType.Id,
    name: ModelType.String,
    ino: { ...ModelType.Integer, unique: true },
    isFolder: { ...ModelType.Integer, unique: true, default: 0 },
    parentId: { ...ModelType.Integer, default: 0 },
    size: { ...ModelType.Integer, default: 0 },
    category: ModelType.String,
    mimeType: ModelType.String,
    extension: ModelType.String,
    hash: ModelType.String,
    path: { ...ModelType.String, unique: true },
    rootPath: { ...ModelType.String, unique: true },
    createdAt: ModelType.Date,
    updatedAt: { ...ModelType.Date, autoUpdate: true },
    status: { ...ModelType.Integer, default: 0 }
    // 状态
    // 0 = 正常
    // 1 = 回收站
    // 2 = 移动/重命名处理中
    // 3 = 父级删除但子目录需隐藏
});
// ----------------------------------------------------------------------
// 4🥇 文件目录闭包表 (Closure Table)
// 用于快速查询目录树结构
// ----------------------------------------------------------------------
const FilePathTable = db.model("filePaths", {
    //祖先节点 没有父节点插入自己
    ancestor_id: { ...ModelType.Integer, nullable: false, uniqueGroups: ["closure"] },
    // 当前节点
    descendant_id: { ...ModelType.Integer, nullable: false, uniqueGroups: ["closure"] },
    // 层级深度 如：  0 = 父级   1 = 子级  2 = 孙子级
    depth: { ...ModelType.Integer, nullable: false }
});




// ----------------------------------------------------------------------
// 5 ⚙️ 系统配置模型 (Setting Model)
// 用于存储 Key-Value 形式的全局系统配置
// ----------------------------------------------------------------------

const Setting = db.model("settings", {
    id: ModelType.Id,
    keyName: { ...ModelType.String, unique: true, nullable: false },
    value: ModelType.String,
    description: ModelType.String,
    updatedAt: { ...ModelType.Date, autoUpdate: true }
});


// ----------------------------------------------------------------------
// 6. ☁️ 上传任务模型 (Upload Model)
// 用于管理大文件的分块上传和断点续传状态
// ----------------------------------------------------------------------
const UploadRecord = db.model("uploadRecord", {
    id: ModelType.Id,
    userId: ModelType.Integer, // 关联到 users.id
    hash: { ...ModelType.String, nullable: false, uniqueGroups: ["upload"] },
    chunkHash: { ...ModelType.String, nullable: false, uniqueGroups: ["upload"] },
    chunkIndex: { ...ModelType.Integer, nullable: false },
    parentId: { ...ModelType.String, nullable: false },
    tempPath: { ...ModelType.String, nullable: false },
    filename: { ...ModelType.String, nullable: false },
    relativePath: ModelType.String,
    createdAt: ModelType.Date
});




// ----------------------------------------------------------------------
//7. ⭐️ 我的收藏模型 (Favorite Model)
// 存储用户和文件之间的收藏关系
// ----------------------------------------------------------------------
const Favorite = db.model("favorites", {
    id: ModelType.Id,
    userId: { ...ModelType.Integer, nullable: false, uniqueGroups: ["favorite"] }, // 关联到 users.id
    fileId: { ...ModelType.Integer, nullable: false, uniqueGroups: ["favorite"] }, // 关联到 files.id
    createdAt: ModelType.Date
});


// ----------------------------------------------------------------------
// 8. 最近访问模型
// 存储用户和文件之间的收藏关系
// ----------------------------------------------------------------------

const RecentFiles = db.model("recentFiles", {
    id: ModelType.Id,
    userId: { ...ModelType.Integer, nullable: false, uniqueGroups: ["recentFiles"] }, // 关联到 users.id
    fileId: { ...ModelType.Integer, nullable: false, uniqueGroups: ["recentFiles"] }, // 关联到 files.id
    createdAt: ModelType.Date
});



// 导出所有模型供其他模块使用
module.exports = { User, FileTable, Token, Setting, Favorite, RecentFiles, UploadRecord, FilePathTable };