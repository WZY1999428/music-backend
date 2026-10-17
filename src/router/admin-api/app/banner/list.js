import bannerModel from "@/database/model/app/banner.js";

export default {
    action: '获取轮播图列表',
    logType: 'GET_APP_BANNER_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { title, code, pageIndex, pageSize } = ctx.request.query;
        const query = {}
        if (title && title.trim()) query.title = { $like: `%${title.trim()}%` }
        if (code) query.code = { $eq: code };
        const [list, total] = await Promise.all([
            bannerModel.aggregate({
                fields: bannerModel.qualifyFields(["id", "image", "type", "title", "value", "enabled", "createUserId", "sort", "createdAt", "updatedAt"]),
                query,
                // 连表查询 创建人
                joins: [
                    {
                        table: "system_user",
                        as: "user",
                        type: "left",
                        on: {
                            "user.id": bannerModel.qualifyField("createUserId")
                        },
                        select: [
                            {
                                //选择表中的 用户昵称
                                type: "raw",
                                fields: {
                                    "createUser": "user.nickname"
                                }
                            }
                        ]
                    }],
                sort: { createdAt: "asc" },
                ...paginate(pageIndex, pageSize)
            }),
            bannerModel.count({ query })
        ])
        ctx.success({
            list: list.map(item => {
                item.genre = parseJsonToArray(item.genre)
                return item
            }),
            total
        });
    },
}