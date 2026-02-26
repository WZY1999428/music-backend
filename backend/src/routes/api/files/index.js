const { FileTable } = require("@/modules/sqlite/model");
const { generateFileToken } = require("@/modules/tokens")
const scanning = {}; // 简单锁
module.exports = async (ctx) => {
    try {
        const parentId = ctx.query.parentId || 0;
        const keyword = ctx.query.keyword || '';
        const filters = [{ field: "status", value: 0 }];
        if (keyword) filters.push(...[{ field: "name", value: `%${keyword}%`, op: "LIKE" }, { field: "fullPathId", value: `${parentId == 0 ? '' : '%-'} ${parentId}-%`, op: "LIKE" }]);
        else filters.push(...[{ field: "parentId", value: parentId }]);
        let files = await FileTable.joinFind({
            fields: [
                "t1.id",
                "t1.name",
                "t1.path",
                "t1.isFolder",
                "t1.parentId",
                't1.category',
                "t1.size",
                "t1.mimeType",
                "t1.extension",
                "t1.createdAt",
                "t1.updatedAt",
                "t1.status",
                "t2.id as favoriteId"
            ],
            joins: [
                {
                    name: 'favorites',
                    type: 'LEFT JOIN',
                    on: 't2.fileId = t1.id'
                }
            ],
            filters,
            pageIndex: 1,
            pageSize: -1,
        });
        ctx.success(files.map(f => ({ ...f, access_token: generateFileToken(f.id, ctx.state.user.userId) })));
    } catch (err) {
        ctx.fail("获取列表失败: " + err.message);
    }
};
