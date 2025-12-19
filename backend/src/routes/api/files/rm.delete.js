const { FileTable, Favorite } = require("@/modules/sqlite/model");
module.exports = async (ctx) => {
    try {
        const { fileIds, status } = ctx.request.body;
        if (!Array.isArray(fileIds) || fileIds.length === 0) {
            return ctx.fail("无效的文件ID列表");
        }
        if (status == 0) {
            while (true) {
                const files = await FileTable.find([{
                    field: "id",
                    value: { $in: fileIds },
                    op: "in"
                }],{
                    pageSize: -1
                });
                if (files.length === 0) break;
                let successCount = 0;
                for (const file of files) {
                    try {
                        FileTable.beginTransaction();
                        if (file.isFolder === 1) {
                            await FileTable.deleteMany({ parentId: file.id });
                        }
                        await FileTable.deleteOne({ id: file.id });
                        await fs.remove(path.join(file.rootPath, file.path));
                        FileTable.commit();
                        successCount++;
                    } catch (err) {
                        FileTable.rollback();
                        console.error("删除失败：", file.path, err);
                    }
                }
                if (successCount === 0) {
                    throw new Error("删除停止：存在无法删除文件。");
                }
            }
            await Favorite.deleteMany({ fileId: { $in: fileIds }, userId: ctx.state.user.userId });
            ctx.success("文件已永久删除");
        } else {
            await FileTable.updateMany({ id: { $in: fileIds } }, { status: 1 });
            ctx.success("文件已入回收站");
        }
    } catch (error) {
        ctx.fail(error.message);
    }

}