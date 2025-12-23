// 将指定 ID 的项目从回收站恢复到原位置。
const { FileTable } = require("@/modules/sqlite/model");
const path = require("path");
const fs = require("fs-extra");
const status = require("../storage/status");
module.exports = async (ctx) => {
    try {
        const fileIds = ctx.request.body.fileIds
        if (!Array.isArray(fileIds) || fileIds.length == 0) throw new Error("请选择需要恢复的文件")
        const files = await FileTable.find([{ field: "id", value: fileIds, op: "in" }])
        if (!files.length) throw new Error("恢复失败，文件不存在");
        for (const file of files) {
            const fullPathId = file.fullPathId.split("-").filter(Boolean).map(Number)
            fullPathId.shift();
            const parentPath = await FileTable.find([{ field: "id", value: fullPathId, op: "in" }, { field: "status", value: [3, 1], op: "in" }, { field: "isFolder", value: 1 }])
            if (parentPath.length > 1) {
                 
            } else {
                rename(file)
            }
        }

        ctx.success("恢复成功");
    } catch (error) {
        ctx.fail(error.message)
    }
}


async function rename(file) {
    const newPath = path.join(file.path, `../${file.name}`);
    await fs.move(file.path, newPath);
    await FileTable.updateMany([{ field: "id", value: file.id }], { path: newPath, status: 0 });
}