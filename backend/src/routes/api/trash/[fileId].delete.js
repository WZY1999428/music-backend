const { FileTable } = require("@/modules/mongo/model");
const fs = require("fs-extra");
const path = require("path");

module.exports = async (ctx) => {
    const id = ctx.params.fileId;
    try {
        // 彻底删除
        const file = await FileTable.findOne({ id: id, status: 1 });
        if (!file) throw new Error("删除失败，未匹配文件");
        FileTable.beginTransaction();
        if (file.isFolder === 1) await FileTable.deleteMany({ parentId: file.id });
        await FileTable.deleteOne({ id: file.id });
        await fs.remove(path.join(file.rootPath, file.path));
        FileTable.commit();
        ctx.success("清空回收站成功");
    } catch (error) {
        FileTable.rollback();
        ctx.fail(error.message);
    }
};
