const { FilePathTable } = require("@/modules/sqlite/model");
const { generateFileToken } = require("@/modules/tokens")
const { getFileList } = require("@/modules/fileSystem/utils")
module.exports = async (ctx) => {
    try {
        const parentId = ctx.query.parentId || 0;
        const keyword = ctx.query.keyword || '';
        const filters = [{ field: "t2.status", value: 0 }];
        if (parentId == 0) {
            if (!keyword) filters.push({ field: "t2.parentId", value: 0 });
        } else {
            const parent = await FilePathTable.findOne([{ field: "ancestor_id", value: parentId }]);
            if (!parent) throw new Error("父级目录不存在");
            filters.push({ field: "ancestor_id", value: parentId });
            filters.push(keyword ? { field: "depth", value: 0, op: ">" } : { field: "depth", value: 1, op: "=" });
        }
        if (keyword) filters.push({ field: "t2.name", value: `%${keyword}%`, op: "LIKE" })
        const files = await getFileList(filters);
        ctx.success(files.map(f => ({ ...f, access_token: generateFileToken(f.id, ctx.state.user.userId) })));
    } catch (err) {
        ctx.fail("获取列表失败: " + err.message); 
    }
};
 