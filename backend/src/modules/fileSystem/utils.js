// -------------------- 构建数据库记录 --------------------
const crypto = require("crypto");
const { createReadStream } = require("fs");
const { fileTypeFromBuffer } = require('file-type');
const { readChunk } = require('read-chunk');
const fs = require("fs-extra");
const path = require("path");
const fileDir = process.env.PUBLIC_FILE_PATCH;
const { FileTable } = require("@/modules/sqlite/model");
async function buildFileRecord(fullPath, stat, parentId = 0) {
    const name = path.basename(fullPath);
    // 当前节点 fullPathId = 父级 fullPathId + 当前 parentId（或者占位，插入后更新）
    let record = {
        name,
        isFolder: stat.isDirectory() ? 1 : 0,
        parentId,
        fullPathId: '', // 先占位，插入后更新
        rootPath: fileDir,
        ino: stat.ino,
        mimeType: null,
        extension: null,
        category: null,
        size: stat.isFile() ? stat.size : 0,
        hash: null,
        path: path.relative(fileDir, fullPath)
    };

    if (stat.isFile()) {
        record.hash = await hashFile(fullPath);
        const buffer = await readChunk(fullPath, { length: 4100 });
        await fileTypeFromBuffer(buffer).then(({ ext, mime }) => {
            record.mimeType = mime;
            record.extension = ext;
            record.category = getFileCategory(mime, ext);
        }).catch(() => {});
    }

    return record;
}

// -------------------- 核心递归 --------------------
async function scanDir(dirPath, level = 0, parentId = 0, parentFullPathId = '0') {
    const entries = await fs.readdir(dirPath);

    for (const entryName of entries) {
        const fullPath = path.join(dirPath, entryName);
        const stat = await fs.stat(fullPath);

        let record = await buildFileRecord(fullPath, stat, parentId, parentFullPathId);

        // 先插入数据库
        let data;
        try {
            data = await FileTable.insert(record);
        } catch (err) {
            // 忽略已存在的文件
            if (err.errno !== 19) console.error("插入失败:", fullPath, err);
            continue;
        }

        // 更新 fullPathId 为 父 fullPathId + 当前节点 id
        const newFullPathId = `${parentFullPathId}-${data.id}`;
        await FileTable.update({ id: data.id }, { fullPathId: newFullPathId });

        // 如果是目录且层级未超过 4，递归子目录
        if (stat.isDirectory() && level < 4) {
            await scanDir(fullPath, level + 1, data.id, newFullPathId);
        }
    }
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



module.exports = { buildFileRecord, hashFile, scanDir };

