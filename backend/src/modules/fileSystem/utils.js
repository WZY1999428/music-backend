// -------------------- 构建数据库记录 --------------------
const { fileTypeFromBuffer } = require('file-type');
const { readChunk } = require('read-chunk');
const fs = require("fs-extra");
const path = require("path");
const fileDir = process.env.PUBLIC_FILE_PATCH;
const { FileTable } = require("@/modules/sqlite/model");
const HashFile = require("./hashFile");
const MAX_WORKERS = Math.min(require("os").cpus().length, 8);
const hashFile = new HashFile(MAX_WORKERS);
const files = [];
const BATCH_SIZE = 100; // 每批处理 100 个文件
// -------------------- 队列 --------------------
async function queueScanning(dirPaths = []) {
    console.time("QueueScanning");
    console.log("正在加载文件数据库...");
    while (dirPaths.length > 0) {
        const parent = dirPaths.shift();
        const parentPath = path.join(parent.rootPath, parent.path || "")
        const entries = await fs.readdir(parentPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(parentPath, entry.name);
            const record = await buildFileRecord(fullPath, parent.id || 0);
            if (!record) continue;
            if (entry.isDirectory()) {
                dirPaths.push(record);
            }
            record.filePath = fullPath;
            if (parent.id != 0) record.parentRef = parent;
            files.push(record);

        }
        process.stdout.write(`\r已读取，${files.length}个文件`);
    }
    console.log("\n")
    if (files.length > 0) {
        const records = [];
        console.log("正在按批次处理文件信息...");
        let batchIndex = 0;
        let count = files.length;
        const batchLength = Math.ceil(files.length / BATCH_SIZE);
        while (files.length > 0) {
            const b = files.splice(0, BATCH_SIZE).map(f => hashFile.addTask(f));
            const data = await Promise.all(b);
            records.push(...data);
            process.stdout.write(`\r已处理，${++batchIndex}/${batchLength} 批次  已处理${records.length}个文件 , 共${count}个文件`);
        }
        console.log("文件信息处理完成。开始插入数据库。");
        records.sort((a, b) => a.path.length - b.path.length);
        const chunks = records.reduce((r, v, i) => {
            if (i % BATCH_SIZE === 0) r.push([]); r[r.length - 1].push(v); return r;
        }, []);
        records.splice(0, records.length);
        let i = 0;
        while (chunks.length > 0) {
            const batch = chunks.shift();
            try {
                await FileTable.beginTransaction();
                for (const record of batch) {
                    delete record.filePath;
                    const parent = record.parentRef;
                    delete record.parentRef;
                    let data = null;
                    try {
                        data = await FileTable.insert(record);
                        record.id = data.id;
                    } catch (err) {
                        if (err.errno !== 19) console.error("插入失败:", err);
                        continue;
                    }
                    if (parent) {
                        record.fullPathId = `${parent.fullPathId}-${data.id}`;
                        record.parentId = parent.id;
                    } else {
                        record.fullPathId = `0-${data.id}`;
                        record.parentId = 0;
                    }
                    await FileTable.update({ id: data.id }, { fullPathId: record.fullPathId, parentId: record.parentId });
                    process.stdout.write(`已插入${++i}/${count} 个文件\r`);
                }
                await FileTable.commit();
            } catch (error) {
                await FileTable.rollback();
                throw error;
            }
        }
    }
    console.log("\n");
    console.timeEnd("QueueScanning");
}


async function buildFileRecord(fullPath, parentId = 0) {
    const stat = await fs.stat(fullPath);
    const name = path.basename(fullPath);
    // 当前节点 fullPathId = 父级 fullPathId + 当前 parentId（或者占位，插入后更新）
    let record = {
        name,
        isFolder: stat.isDirectory() ? 1 : 0,
        parentId,
        fullPathId: '0', // 先占位，插入后更新
        rootPath: fileDir,
        ino: stat.ino,
        mimeType: null,
        extension: null,
        parentRef: null,
        category: null,
        size: stat.isFile() ? stat.size : 0,
        hash: null,
        path: path.relative(fileDir, fullPath)
    };

    if (stat.isFile()) {
        const buffer = await readChunk(fullPath, { length: 4100 });
        await fileTypeFromBuffer(buffer).then(({ ext, mime }) => {
            record.mimeType = mime;
            record.extension = ext;
            record.category = getFileCategory(mime, ext);
        }).catch(() => { });
    }

    return record;
}


function parseParendIds(fullPathId) {
    const ids = [];
    const arr = fullPathId.split("-");
    for (let i = 0; i < arr.length - 1; i++) {
        const num = parseInt(arr[i]);
        if (isFinite(num)) ids.push(num);
    }
    return ids
}


function replacePathSegment(fullPath, index, newName) {
    const parts = fullPath.split(path.sep).filter(Boolean);

    if (index < 0 || index >= parts.length) {
        throw new Error('index 越界了，路径段不存在');
    }

    parts[index] = newName;
    return path.join(...parts);
}


function getFileCategory(mimeType, extension) {
    if (!mimeType && !extension) return 'other';

    const ext = extension ? extension.toLowerCase() : '';
    const type = mimeType ? mimeType.toLowerCase() : '';

    // -------- mimeType 判断 --------
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';

    const documentTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.ms-excel',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv',
        'application/rtf',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/vnd.oasis.opendocument.presentation'
    ];
    if (documentTypes.includes(type)) return 'document';

    const archiveTypes = [
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed',
        'application/x-tar',
        'application/gzip',
        'application/x-bzip2',
        'application/x-xz'
    ];
    if (archiveTypes.includes(type)) return 'archive';

    // -------- 扩展名判断 --------
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg', 'heic'];
    const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'wmv', 'm4v'];
    const audioExts = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma'];
    const documentExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf', 'odt', 'ods', 'odp'];
    const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];

    if (imageExts.includes(ext)) return 'image';
    if (videoExts.includes(ext)) return 'video';
    if (audioExts.includes(ext)) return 'audio';
    if (documentExts.includes(ext)) return 'document';
    if (archiveExts.includes(ext)) return 'archive';

    return 'other';
}



module.exports = { buildFileRecord, hashFile, queueScanning, parseParendIds, replacePathSegment };

