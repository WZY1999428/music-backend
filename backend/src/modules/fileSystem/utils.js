// -------------------- 构建数据库记录 --------------------

const fs = require("fs-extra");
const path = require("path");
const fileDir = process.env.PUBLIC_FILE_PATCH;
const { FileTable, Favorite, FilePathTable } = require("@/modules/sqlite/model");
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
        const dbFiles = await getFileList(dirPaths.map(f => ({ field: "ancestor_id", value: f.id || 0 }, { field: "depth", value: f.depth || 0 })));
        const files = await readFiles(dirPaths, dbFiles);
        await writeFiles(files);
        if (dbFiles.length > 0) {
            const batchIds = dbFiles.map(f => f.id).reduce((r, v, i) => { if (i % BATCH_SIZE === 0) r.push([]); r[r.length - 1].push(v); return r; }, []);
            for (const ids of batchIds) {
                await FileTable.deleteMany([{ field: "id", value: ids, op: "in" }]).catch(() => { });
                await Favorite.deleteMany([{ field: "fileId", value: ids, op: "in" }]).catch(() => { });
                await FilePathTable.deleteMany([{ field: "descendant_id", value: ids, op: "in", logic: "or" }, { field: "ancestor_id", value: ids, op: "in" }])
            }
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

async function readFiles(dirPaths, dbFiles) {
    console.time("QueueScanning");
    console.log("正在加载文件数据库...");
    const files = [];

    while (dirPaths.length > 0) {
        const parent = dirPaths.shift();
        const parentPath = path.join(parent.rootPath, parent.path || "")
        const entries = await fs.readdir(parentPath, { withFileTypes: true });
        if (await fs.exists(parentPath)) {
            for (const entry of entries) {
                const fullPath = path.join(parentPath, entry.name);
                const record = await buildFileRecord(fullPath, 0);
                record.filePath = fullPath;
                if (parent.path != "") record.parentRef = parent
                files.push(record);
                if (entry.isDirectory()) {
                    dirPaths.push(record);
                }
            }
        }

        process.stdout.write(`\r已读取，${files.length}个文件`);
    }


    const fileMap = new Map(files.map(f => [f.ino, f]));
    let filterCount = 0;
    console.log(dbFiles.length);
    for (let i = 0; i < dbFiles.length; i++) {
        const dbf = dbFiles[i];
        const file = fileMap.get(dbf.ino);
        if (file && await fs.exists(path.join(dbf.rootPath, dbf.path))) {
            file.parentId = dbf.parentId;
            fileMap.delete(dbf.ino);
            dbFiles.splice(i, 1);
            i--;
            filterCount++;
        }
    }

    if (filterCount > 0) console.log(`\n 已过滤${filterCount}个数据库存在的文件`);
    return Array.from(fileMap.values());
}

async function writeFiles(files) {
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
        // console.log(records.slice(0,10));
        let i = 0;
        const ids = []
        while (records.length > 0) {
            const record = records.shift();
            try {
                delete record.filePath;
                const parent = record.parentRef;
                if (record.parentRef) delete record.parentRef
                record.parentId = parent?.id || 0;
                try {
                    const data = await FileTable.insert(record);
                    record.id = data.id;
                    await FilePathTable.insert({ ancestor_id: record.id, descendant_id: record.id, depth: 0 });
                    if (record.parentId != 0) {
                        const parentPaths = await FilePathTable.find([{ field: "descendant_id", value: record.parentId }]);
                        for (const p of parentPaths) await FilePathTable.insert({ ancestor_id: p.ancestor_id, descendant_id: data.id, depth: p.depth + 1 });
                    }
                } catch (err) {
                    if (err.errno !== 19) console.error("插入失败:", err);
                }
                process.stdout.write(`已插入${++i}/${count} 个文件\r`);
            } catch (error) {
                throw error;
            }
        }
    }
}


async function getFileList(filters, joins = [], { pageIndex = 1, pageSize = -1 } = {}) {
    return await FilePathTable.joinFind({
        fields: [
            "t2.id",
            "t2.name",
            "t2.path",
            "t2.isFolder",
            't2.category',
            "t2.size",
            "t2.mimeType",
            "t2.extension",
            "t2.createdAt",
            "t2.updatedAt",
            "t2.status",
            "t1.depth",
            "t2.parentId",
            "t1.ancestor_id",
            "t1.descendant_id",
        ],
        joins: [
            {
                name: 'files',
                type: 'LEFT JOIN',
                on: 't2.id = t1.descendant_id'
            },
            ...joins
        ],
        filters,
        pageIndex,
        pageSize,
    });
}


async function ensureDirRecord(relativePath, parentId) {
    const parsePath = path.parse(relativePath);
    const dirs = parsePath.dir.split("/").filter(Boolean);
    const parent = await FileTable.findOne([{ field: "path", value: parsePath.dir }]);
    if (parent) return parent.id;
    if (dirs.length) {
        let dirPath
        if (parentId != 0) {
            const parent = await FileTable.findOne([{ field: "id", value: parentId }]);
            dirPath = path.join(parent.rootPath, parent.path);
        } else dirPath = fileDir
        for (const dir of dirs) {
            const parent = await FileTable.findOne([{ field: "path", value: dirPath }]);
            dirPath = path.join(dirPath, dir);
            if (!await fs.pathExists(dirPath) || !parent) {
                await fs.ensureDir(dirPath);
                const file = await FileTable.findOne([{ field: "path", value: normalizePathForDB(fileDir, dirPath) }]);
                if (!file) {
                    const record = await buildFileRecord(dirPath, parentId);
                    try {
                        await FileTable.runInTransaction(async () => {
                            const ret = await FileTable.insert(record);
                            // await FileTable.update({ id: ret.id }, { fullPathId: fullPathId })
                            parentId = ret.id
                        })
                    } catch (error) {
                        if (error.errno === 19) {
                            const existing = await FileTable.findOne([{ field: "path", value: record.path }]);
                            if (!existing) throw error;
                            parentId = existing.id;
                        } else {
                            throw error;
                        }
                    }
                } else {
                    parentId = file.id
                }
            } else {
                parentId = parent.id;
            }
        }
    }
    return parentId
}


async function buildFileRecord(fullPath, parentId = 0) {
    const { fileTypeFromBuffer } = await import('file-type');
    const { readChunk } = await import('read-chunk');
    const stat = await fs.stat(fullPath).catch(() => null);
    const name = path.basename(fullPath);
    let record = {
        name,
        isFolder: stat ? (stat.isDirectory() ? 1 : 0) : 1,
        parentId,
        rootPath: fileDir,
        ino: stat?.ino,
        mimeType: null,
        extension: null,
        category: null,
        size: stat ? (stat.isFile() ? stat.size : 0) : 0,
        hash: null,
        path: normalizePathForDB(fileDir, fullPath)
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

/**
 * 将本地路径转换为数据库存储路径，统一使用 '/' 分隔符
 * @param {string} baseDir - 根目录，用于生成相对路径
 * @param {string} targetPath - 目标路径
 * @returns {string} 数据库存储路径
 */
function normalizePathForDB(rootDir, fullPath) {
    // 1. 相对路径
    let relative = path.relative(rootDir, fullPath);

    // 2. 统一使用 / 分隔
    relative = relative.split(path.sep).join('/');

    // 3. 去掉首尾空格
    relative = relative.trim();

    // 4. 可选：统一大小写
    // relative = relative.toLowerCase();

    return relative;
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


module.exports = { buildFileRecord, hashFile, queueScanning, parseParendIds, replacePathSegment, replacePathSegmentByName, isValidFileName, ensureDirRecord, normalizePathForDB, getFileList };

