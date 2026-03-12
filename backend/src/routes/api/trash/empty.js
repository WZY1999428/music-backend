const { FileTable } = require("@/modules/mongo/model");
const fs = require("fs-extra");
const path = require("path");

module.exports = async (ctx) => {
    try {
        while (true) {
            const files = await FileTable.find({ status: 1 }, { pageSize: 0 });
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
            // ❗ 一次循环里一条都删不掉 → 死循环风险 → 立即 break
            if (successCount === 0) {
                console.error("回收站清空停止：所有项目均无法删除，避免死循环。");
                throw new Error("回收站清空停止：存在无法删除文件。");
            }
        }

        ctx.success("清空回收站成功");
    } catch (error) {
        ctx.fail(error.message);
    }
};
