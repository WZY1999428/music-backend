// -------------------- 构建数据库记录 --------------------
const crypto = require("crypto");
const { createReadStream } = require("fs");
const fs = require("fs/promises");
const path = require("path");
const fileDir = process.env.PUBLIC_FILE_PATCH;
const {FileTable} = require("../sqlite/model");
async function buildFileRecord(fullPath, stat, parent_id = 0) {
    let hash = null;
    if (stat.isFile()) {
        hash = await hashFile(fullPath);
    }
    return {
        name: path.basename(fullPath),
        isFolder: stat.isDirectory() ? 1 : 0,
        parentId: parent_id,
        rootPath: fileDir,
        ino: stat.ino,
        size: stat.isFile() ? stat.size : 0,
        hash,
        path: path.relative(fileDir, fullPath)
    };
}

// -------------------- 文件 MD5 --------------------
function hashFile(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash("md5");
        const stream = createReadStream(filePath);
        stream.on("data", chunk => hash.update(chunk));
        stream.on("end", () => resolve(hash.digest("hex")));
        stream.on("error", reject);
    });
}


// -------------------- 核心递归 --------------------
async function scanDir(p, level = 0, parent_id = 0) {
    const entries = await fs.readdir(p);
    for (const entryName of entries) {
        const fullPath = path.join(p, entryName);
        const stat = await fs.stat(fullPath);
        const record = await buildFileRecord(fullPath, stat, parent_id);
        // 插入数据库，返回自增 id
        let data;
        try {
            data = await FileTable.insert(record);
        } catch (err) {
            // 忽略已存在的文件
            if (err.errno !== 19) console.error("插入失败:", fullPath, err);
            continue;
        }
        // 如果是目录且层级未超过 4，递归子目录
        if (stat.isDirectory() && level < 4 && data) {
            await scanDir(fullPath, level + 1, data.id);
        }
    }
}



module.exports = { buildFileRecord, hashFile, scanDir };