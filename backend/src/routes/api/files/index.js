const fs = require("fs-extra");
const path = require("path");
const { FileTable } = require("@/modules/sqlite/model");
const { scanDir } = require("@/modules/fileSystem/utils");

module.exports = async (ctx) => {
    try {
        const parentId = ctx.query.parentId || 0;
        let files = await FileTable.find([{ field: "parentId", value: parentId }]);
        if (parentId != 0 && files.length === 0) {
            const file = await FileTable.findOne({ id: parentId });
            if (!file) return ctx.fail("父目录不存在");
            const filePath = path.join(file.rootPath, file.path);
            const stat = await fs.stat(filePath);
            if (stat.isDirectory()) {
                await scanDir(filePath, 0, parentId);
                files = await FileTable.find([{ field: "parentId", value: parentId }]);
            }
        }
        ctx.success(files);
    } catch (err) {
        ctx.fail("获取列表失败: " + err.message);
    }
};
