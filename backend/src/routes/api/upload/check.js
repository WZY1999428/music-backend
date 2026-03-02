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
                    await cpFile(dataPath, fullPath, hash, parentId)
                    ctx.success({ filePath: [], exists: true })
                } else if (parent) {
                    if (parent.isFolder != 1) {
                        throw new Error("父级id不是一个文件夹");
                    }
                    const filePath = path.join(parent.path, filename);
                    const fullPath = path.join(data.rootPath, filePath)
                    await cpFile(dataPath, fullPath, hash, parentId)
                    ctx.success({ filePath: filePath, exists: true })
                } else {
                    ctx.success({ filePath: [], exists: false })
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
    if (src != dest) {
        await fs.copy(src, dest);
        const newRecord = await buildFileRecord(dest, parentId);
        newRecord.hash = hash;
        await FileTable.insert(newRecord)
        const ret = await FileTable.insert(newRecord)
        await FileTable.update({ id: ret.id }, { fullPathId: `0-${ret.id}` })
    }
}