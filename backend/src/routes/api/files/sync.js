const { FileTable } = require("@/modules/sqlite/model")
const { queueScanning } = require("@/modules/fileSystem/utils")
module.exports = async (ctx) => {
    try {
        const id = ctx.query.id || 0
        let target
        if (id == 0) { target = [{ rootPath: process.env.PUBLIC_FILE_PATCH, path: "", id: 0 }] } else { target = await FileTable.find([{ field: "id", value: id },]) }
        if (!target.length && id != 0) ctx.fail("同步失败 目录不存在");
        console.log(target);
        await queueScanning(target)
        ctx.success(null, "同步成功")
    } catch (error) {
        ctx.fail(error.message)
    }
}