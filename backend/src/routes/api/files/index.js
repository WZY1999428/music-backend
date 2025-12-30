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
        const filters = [{ field: "status", value: 0 }];
        if (keyword) filters.push(...[{ field: "name", value: `%${keyword}%`, op: "LIKE" }, { field: "fullPathId", value: `${parentId == 0 ? '' : '%-'} ${parentId}-%`, op: "LIKE" }]);
        else filters.push(...[{ field: "parentId", value: parentId }]);
        let files = await FileTable.find(filters, {
            pageIndex: 1,
            pageSize: -1,
            fields: ["id", "name", "path", "isFolder", "parentId", 'category', "size", "mimeType", "extension", "createdAt", "updatedAt", "status"]
        });
        for (const file of files) {
            const token = generateFileToken(file.id);
            file.access_token = token;
        }
        ctx.success(files);
    } catch (err) {
        ctx.fail("获取列表失败: " + err.message);
    }
};
