import agreementsModel from "@/database/model/contentMgmt/agreements.js";

export default {
    action: '获取协议列表',
    logType: 'GET_CONTENT_MGMT_AGREEMENTS_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { title, code, pageIndex, pageSize } = ctx.request.query;
        const query = {}
        if (title && title.trim()) query.title = { $like: `%${title.trim()}%` }
        if (code) query.code = { $eq: code };
        const page = paginate(pageIndex, pageSize);
        const agreementsFields = agreementsModel.qualifyFields(["id", "title", "code", "createdAt", "updatedAt", "enabled"]);
        const [list, total] = await Promise.all([
            agreementsModel.aggregate({
                fields: agreementsFields,
                query,
                // 连表查询 创建人
                joins: [{
                    table: "system_user",
                    as: "user",
                    type: "left",
                    on: {
                        "user.id": agreementsModel.qualifyField("createUserId")
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
                group: [agreementsFields[0]],
                sort: { createdAt: "asc" },
                ...page,
            }),
            agreementsModel.count({ query })
        ])
        ctx.success({
            list,
            total
        });
    },
}