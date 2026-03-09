// 检查文件是否存在
const { FileTable, UploadRecord } = require("@/modules/sqlite/model");
const { buildFileRecord, ensureDirRecord } = require("@/modules/fileSystem/utils");
const fs = require("fs-extra");
const path = require("path");
module.exports = async (ctx) => {
    try {
        let { hash, parentId, filename, relativePath } = ctx.query;
        if (!hash) throw new Error("hash不能为空");
        if (!parentId) throw new Error("parentId不能为空");
        const files = await FileTable.find([{ "field": "hash", "value": hash }], { pageSize: -1 });
        if (files.length) {
            const file = files.some(f => f.path == relativePath || f.parentId == parentId);
            if (!file) {
                const data = files[0];
                const dataPath = path.join(data.rootPath, data.path);
                const parent = await FileTable.findOne([{ field: "id", value: parentId }]);
                if (!parent && parentId != 0) {
                    throw new Error("父级id不存在");
                } else if (parentId == 0) {
                    let fullPath = path.join(data.rootPath, filename);
                    if (relativePath) {
                        parentId = await ensureDirRecord(relativePath, parentId);
                        fullPath = path.join(data.rootPath, relativePath);
                    };
                    const cpd = await cpFile(dataPath, fullPath, hash, parentId)
                    cpd ? ctx.success({ filePath: filename, exists: true }) : ctx.success({ files: [], exists: false })
                } else if (parent) {
                    if (parent.isFolder != 1) throw new Error("父级id不是一个文件夹");
                    const filePath = path.join(parent.path, filename);
                    const fullPath = path.join(data.rootPath, filePath)
                    const cpd = await cpFile(dataPath, fullPath, hash, parentId)
                    cpd ? ctx.success({ filePath: filename, exists: true }) : ctx.success({ files: [], exists: false })
                } else {
                    ctx.success({ files: [], exists: false })
                }
            } else {
                ctx.success({ filePath: file.path, exists: true })
            }
        } else {
            const validRecords = [];
            for (const f of files) if (await fs.pathExists(f.tempPath)) validRecords.push(f);
            ctx.success({ files: validRecords, exists: false });
        }
    } catch (error) {
        ctx.fail(error.message)
    }
};

async function cpFile(src, dest, hash, parentId) {
    try {
        if (src != dest) {
            await fs.copy(src, dest);
            const newRecord = await buildFileRecord(dest, parentId);
            await FileTable.runInTransaction(async () => {
                newRecord.hash = hash;
                const ret = await FileTable.insert(newRecord)
                 await createClosurePaths(ret.id, parentId)
            })
        }
        return true;
    } catch (error) {
        return false;
    }
}