const { FileTable } = require("@/modules/sqlite/model");
const fs = require("fs-extra");
const path = require("path");

module.exports = async (ctx) => {
    const id = ctx.params.fileId;
    try {
        const file = await FileTable.findOne([{ id: id, status: 1 }]);
        if (!file) {
            ctx.fail("回收站不存在此文件");
            return;
        };
        FileTable.beginTransaction();
        if (file.isFolder === 1) {
            await FileTable.deleteMany({ parentId: file.id });
        }
        await FileTable.deleteOne({ id: file.id });
        await fs.remove(path.join(process.env.PUBLIC_FILE_PATCH, file.path));
        FileTable.commit();
        ctx.success("清空回收站成功");
    } catch (error) {
        FileTable.rollback();
        ctx.fail(error.message);
    }
};
