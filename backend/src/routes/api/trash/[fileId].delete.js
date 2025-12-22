const { FileTable } = require("@/modules/sqlite/model");
const fs = require("fs-extra");
const path = require("path");

module.exports = async (ctx) => {
    const id = ctx.params.fileId;
    const status = ctx.request.body.status || 0;  // 0: 添加到回收站  1: 直接删除 
    try {
        const file = await FileTable.findOne([{ id: id, status: 0 }]);
        if (!file) throw new Error("添加到回收站失败，文件不存在");
        FileTable.beginTransaction();
        if (file.isFolder === 1) await FileTable.deleteMany({ parentId: file.id });
        await FileTable.deleteOne({ id: file.id });
        await fs.remove(path.join(process.env.PUBLIC_FILE_PATCH, file.path));
        FileTable.commit();
        ctx.success("清空回收站成功");
    } catch (error) {
        FileTable.rollback();
        ctx.fail(error.message);
    }
};
