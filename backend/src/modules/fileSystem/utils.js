// -------------------- 构建数据库记录 --------------------
const crypto = require("crypto");
const { createReadStream } = require("fs");
const { fileTypeFromBuffer } = require('file-type');
const { readChunk } = require('read-chunk');
const fs = require("fs-extra");
const path = require("path");
const fileDir = process.env.PUBLIC_FILE_PATCH;
const { FileTable } = require("../sqlite/model");
async function buildFileRecord(fullPath, stat, parent_id = 0) {
    const record = {
        name: path.basename(fullPath),
        isFolder: stat.isDirectory() ? 1 : 0,
        parentId: parent_id,
        rootPath: fileDir,
        ino: stat.ino,
        mimeType: null,
        extension: null,
        size: stat.isFile() ? stat.size : 0,
        hash: null,
        path: path.relative(fileDir, fullPath)
    };
    if (stat.isFile()) {
        record.hash = await hashFile(fullPath);
        const buffer = await readChunk(fullPath, { length: 4100 });
        const { ext, mime } = await fileTypeFromBuffer(buffer)
        record.mimeType = mime;
        record.extension = ext;
    }

    return record
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

