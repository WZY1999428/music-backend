const fs = require("fs-extra");
const path = require("path");
const { FileTable } = require("@/modules/sqlite/model");
const { scanDir } = require("@/modules/fileSystem/utils");
const { generateFileToken, fileTokens } = require("@/modules/tokens")
const scanning = {}; // 简单锁
module.exports = async (ctx) => {
    try {
        const parentId = ctx.query.parentId || 0;
        let files = await FileTable.find([{ field: "parentId", value: parentId }], 1, -1, ["id", "name", "path", "isFolder", "parentId", 'category', "size", "mimeType", "extension", "createdAt", "updatedAt"]);
        if (parentId != 0 && files.length === 0) {
            const file = await FileTable.findOne({ id: parentId });
            if (!file) return ctx.fail("父目录不存在");
            const filePath = path.join(file.rootPath, file.path);
            const stat = await fs.stat(filePath);
            if (stat.isDirectory()) {
                // 避免重复扫描
                if (!scanning[parentId]) {
                    scanning[parentId] = true;
                    await scanDir(filePath, 0, parentId);
                    files = await FileTable.find([{ field: "parentId", value: parentId }]);
                    delete scanning[parentId];
                }
            }
        }

        for (const file of files) {
            if (file.isDirectory == 0) {
                const token = generateFileToken(file.id);
                fileTokens.set(file.id, token);
                file.token = token;
            }
        }

        ctx.success(files);
    } catch (err) {
        ctx.fail("获取列表失败: " + err.message);
    }
};
