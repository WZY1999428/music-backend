const fs = require('fs-extra');
const path = require('path');
const { fileTypeFromBuffer } = require('file-type');
const { readChunk } = require('read-chunk');
const os = require('os');
const MAX_WORKERS = Math.min(os.cpus().length, 8);
const HashFile = require("./src/modules/fileSystem/hashFile");
async function buildFileRecord(rootPath, fullPath, parentId = 0) {
    const stat = await fs.stat(fullPath);
    const name = path.basename(fullPath);
    // 当前节点 fullPathId = 父级 fullPathId + 当前 parentId（或者占位，插入后更新）
    let record = {
        name,
        isFolder: stat.isDirectory() ? 1 : 0,
        parentId,
        fullPathId: '', // 先占位，插入后更新
        rootPath,
        ino: stat.ino,
        mimeType: null,
        extension: null,
        category: null,
        size: stat.isFile() ? stat.size : 0,
        hash: null,
        path: path.relative(rootPath, fullPath)
    };

    if (stat.isFile()) {
        const buffer = await readChunk(fullPath, { length: 4100 }).catch(() => null);
        if (!buffer) return buffer;
        await fileTypeFromBuffer(buffer).then(({ ext, mime }) => {
            record.mimeType = mime;
            record.extension = ext;
            record.category = getFileCategory(mime, ext);
        }).catch(() => { });
    }

    return record;
}

queueScanning([{
    rootPath: "D:/迅雷下载",
    path: "",
    id: 0,
}]);


const hashFile = new HashFile(MAX_WORKERS);
const files = [];
const BATCH_SIZE = 100; // 每批处理 100 个文件
// -------------------- 队列 --------------------
async function queueScanning(dirPaths = [], parentId = 0) {
    console.time("QueueScanning");
    while (dirPaths.length > 0) {
        const parent = dirPaths.shift();
        const parentPath = path.join(parent.rootPath, parent.path || "")
        const entries = await fs.readdir(parentPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(parentPath, entry.name);
            const record = await buildFileRecord(parent.rootPath, fullPath, parent.id || 0);
            if (!record) continue;
            if (entry.isDirectory()) {
                dirPaths.push(record);
            } else {
                record.filePath = fullPath;
                files.push(record);
            }
        }
    }
    if (files.length > 0) {
        const results = [];
        while (files.length > 0) {
            const data = await Promise.all(files.splice(0, BATCH_SIZE).map(f => hashFile.addTask(f)));
            results.push(...data);
        }
        console.log(results);
    }
    console.timeEnd("QueueScanning");
}

