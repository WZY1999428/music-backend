// 检查文件是否存在
const { FileTable, UploadRecord } = require("@/modules/sqlite/model");
const { buildFileRecord } = require("@/modules/fileSystem/utils");
const fs = require("fs-extra");
const path = require("path");
module.exports = async (ctx) => {
    try {
        const { hash, parentId, filename } = ctx.query;
        if (!hash) throw new Error("hash不能为空");
        if (!parentId) throw new Error("parentId不能为空");
        const data = await FileTable.findOne([{ "field": "hash", "value": hash }]);
        if (data) {
            if (data.parentId != parentId) {
                const parent = await FileTable.findOne([{ field: "id", value: parentId }]);
                if(!parent){
                    throw new Error("父级id不存在");
                }
                if (parent.isFolder != 1) {
                    throw new Error("父级id不是一个文件夹");
                }
                const filePath = path.join(parent.path, filename);
                const fullPath = path.join(parent.rootPath, filePath)
                await fs.copy(path.join(data.rootPath, data.path), fullPath);
                const newRecord = await buildFileRecord(fullPath, parentId);
                newRecord.hash = hash;
                await FileTable.insert(newRecord)
                ctx.success({ filePath: filePath, exists: true })
            } else {
                ctx.success({ filePath: data.path, exists: true })
            }
        } else {
            const files = await UploadRecord.find([{ field: "hash", value: hash }], { pageSize: -1 });
            const validRecords = [];
            for (const record of files) {
                if (await fs.pathExists(record.tempPath)) validRecords.push(record);
            }
            ctx.success({ files, exists: false })
        }
    } catch (error) {
        console.log(error);
        ctx.fail(error.message)
    }
};