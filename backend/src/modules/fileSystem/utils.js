// -------------------- 构建数据库记录 --------------------

const fs = require("fs-extra");
const path = require("path");
const fileDir = process.env.PUBLIC_FILE_PATCH;
const { FileTable, Favorite } = require("@/modules/sqlite/model");
const HashFile = require("./hashFile");
const MAX_WORKERS = Math.min(require("os").cpus().length, 8);
const hashFile = new HashFile(MAX_WORKERS);
const BATCH_SIZE = 100; // 每批处理 100 个文件
let isScanning = false;
// -------------------- 队列 --------------------
async function queueScanning(dirPaths = []) {
    if (isScanning) throw new Error("正在扫描中，请稍后重试");
    isScanning = true;
    try {
        const files = [];
        console.time("QueueScanning");
        console.log("正在加载文件数据库...");
        const dbFiles = await FileTable.find(dirPaths.map(f => ({ field: "fullPathId", value: f.id == 0 ? `%0-%` : `%-${f.id}-%`, op: "like", logic: "OR" })), { pageSize: -1 });
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
        const fileMap = new Map(files.map(f => [f.ino, f]));
        let filterCount = 0;
        for (let i = 0; i < dbFiles.length; i++) {
            const dbf = dbFiles[i];
            const file = fileMap.get(dbf.ino);
            if (file && await fs.exists(path.join(dbf.rootPath, dbf.path))) {
                file.parentId = dbf.parentId;
                file.fullPathId = dbf.fullPathId;
                fileMap.delete(dbf.ino);
                dbFiles.splice(i, 1);
                i--;
                filterCount++;
            }
        }

        if (filterCount > 0) console.log(`\n 已过滤${filterCount}个数据库存在的文件`);
        const newFiles = Array.from(fileMap.values());
        if (newFiles.length > 0) {
            const records = [];
            console.log("正在按批次处理文件信息...");
            let batchIndex = 0;
            let count = newFiles.length;
            const batchLength = Math.ceil(newFiles.length / BATCH_SIZE);
            while (newFiles.length > 0) {
                const b = newFiles.splice(0, BATCH_SIZE).map(f => hashFile.addTask(f));
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
                        if (record.parentRef) delete record.parentRef;
                        let data = null;
                        try {
                            data = await FileTable.insert(record);
                            record.id = data.id;
                        } catch (err) {
                            if (err.errno !== 19) console.error("插入失败:", err);
                            continue;
                        }
                        console.log(parent);
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

        if (dbFiles.length > 0) {
            const ids = dbFiles.map(f => f.id);
            await FileTable.deleteMany([{ field: "id", value: ids, op: "in" }]).catch(() => { });
            await Favorite.deleteMany([{ field: "fileId", value: ids, op: "in" }]).catch(() => { });
        }
        hashFile.clear();
        isScanning = false;
        console.log("\n");
        console.timeEnd("QueueScanning");
    } catch (error) {
        isScanning = false;
        console.log(error);
        hashFile.clear();
        throw error;
    }
}


async function buildFileRecord(fullPath, parentId = 0) {
    const { fileTypeFromBuffer } = await import('file-type');
    const { readChunk } = await import('read-chunk');
    const stat = await fs.stat(fullPath).catch(() => null);
    const name = path.basename(fullPath);
    // 当前节点 fullPathId = 父级 fullPathId + 当前 parentId（或者占位，插入后更新）
    let record = {
        name,
        isFolder: stat ? (stat.isDirectory() ? 1 : 0) : 1,
        parentId,
        fullPathId: '0', // 先占位，插入后更新
        rootPath: fileDir,
        ino: stat?.ino,
        mimeType: null,
        extension: null,
        category: null,
        size: stat ? (stat.isFile() ? stat.size : 0) : 0,
        hash: null,
        path: path.relative(fileDir, fullPath)
    };

    if (stat && stat.isFile()) {
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
    for (let i = 0; i < arr.length; i++) {
        const num = parseInt(arr[i]);
        if (isFinite(num) && num != 0) ids.push(num);
    }
    return ids
}


function replacePathSegmentByName(path, name) {
    return path.join(node.path, `../${name}`);
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


function isValidFileName(name) {
    if (!name) return false;

    // Windows 不允许
    if (/[\. ]$/.test(name)) return false;

    // Windows 保留名
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name)) return false;

    return true;
}


module.exports = { buildFileRecord, hashFile, queueScanning, parseParendIds, replacePathSegment, replacePathSegmentByName, isValidFileName };

