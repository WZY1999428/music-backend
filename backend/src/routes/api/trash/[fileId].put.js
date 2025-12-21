// 将指定 ID 的项目从回收站恢复到原位置。
const { FileTable } = require("@/modules/sqlite/model");
module.exports = async (ctx) => {
    try {
        const id = ctx.params.fileId
        const file = await FileTable.findOne({ id })
        if (!file) return ctx.fail("恢复失败，文件不存在");
        await FileTable.update({ id }, { status: 0 });
        ctx.success("恢复成功");
    } catch (error) {
        ctx.fail(error.message)
    }
}