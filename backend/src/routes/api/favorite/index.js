const { Favorite } = require("@/modules/sqlite/model");
const { generateFileToken } = require("@/modules/tokens")
module.exports = async (ctx) => {
    try {
        const pageIndex = parseInt(ctx.query.pageIndex) || 1;
        const pageSize = parseInt(ctx.query.pageSize) || 20;
        console.log(ctx.state.user.userId);
        const favoriteQuery = await Favorite.joinFind({
            fields: [
                "t2.id",
                "t2.name",
                "t2.path",
                "t2.isFolder",
                "t2.parentId",
                't2.category',
                "t2.size",
                "t2.mimeType",
                "t2.extension",
                "t2.createdAt",
                "t2.updatedAt",
                "t2.status",
                "t1.id as favoriteId"
            ],
            joins: [
                {
                    name: 'files',
                    type: 'INNER JOIN', // LLL JOIN, LEFT JOIN
                    on: 't1.fileId = t2.id'
                },
                {
                    name: 'users',
                    type: 'INNER JOIN',
                    on: 't1.userId = t3.id'
                }
            ],
            filters: [
                {
                    field: 't1.userId',
                    op: '=',
                    value: ctx.state.user.userId
                },
            ],
            pageIndex,
            pageSize
        });
        ctx.success(favoriteQuery.map(f => ({ ...f, access_token: generateFileToken(f.id, ctx.state.user.userId) })));
    } catch (error) {
        ctx.fail(error.message);
    }
};