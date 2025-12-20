const fs = require("fs-extra");
const path = require("path");
const { FileTable } = require("@/modules/sqlite/model");
const { scanDir } = require("@/modules/fileSystem/utils");
const { generateFileToken, fileTokens } = require("@/modules/tokens")
const scanning = {}; // 简单锁
module.exports = async (ctx) => {
    try {
        const parentId = ctx.query.parentId || 0;
        const keyword = ctx.query.keyword || '';
        const filters = []
        if (keyword) filters.push(...[{ field: "name", value: `%${keyword}%`, op: "LIKE" }, { field: "fullPathId", value: `${parentId == 0 ? '' : '%-'} ${parentId}-%`, op: "LIKE" }, { field: "status", value: 0 }]);
        else filters.push(...[{ field: "parentId", value: parentId }, { field: "status", value: 0 }]);
        let files = await FileTable.find(filters, {
            pageIndex: 1,
            pageSize: -1,
            fields: ["id", "name", "path", "isFolder", "parentId", 'category', "size", "mimeType", "extension", "createdAt", "updatedAt"]
        });
        if (parentId != 0 && files.length === 0 && !keyword) {
            const file = await FileTable.findOne({ id: parentId });
            if (!file) return ctx.fail("父目录不存在");
            const filePath = path.join(file.rootPath, file.path);
            const stat = await fs.stat(filePath);
            if (stat.isDirectory()) {
                // 避免重复扫描
                if (!scanning[parentId]) {
                    scanning[parentId] = true;
                    const file = await FileTable.findOne({ parentId: parentId });
                    await scanDir(filePath, 0, parentId, file.fullPathId);
                    files = await FileTable.find([{ field: "parentId", value: parentId }], { pageSize: -1, });
                    delete scanning[parentId];
                }
            }
        }
        for (const file of files) {
            const token = generateFileToken(file.id);
            file.access_token = token;
        }
        ctx.success(files);
    } catch (err) {
        ctx.fail("获取列表失败: " + err.message);
    }
};
