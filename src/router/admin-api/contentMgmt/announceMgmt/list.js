import announceMgmtModel from "@/database/model/contentMgmt/announceMgmt.js";

export default {
    action: '获取公告列表',
    logType: 'GET_CONTENT_MGMT_ANNOUNCE_MGMT_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { title, code, pageIndex, pageSize } = ctx.request.query;
        const query = {}
        if (title && title.trim()) query.title = { $like: `%${title.trim()}%` }
        if (code) query.code = { $eq: code };
        const page = paginate(pageIndex, pageSize);
        const announceMgmtFields = announceMgmtModel.qualifyFields(["id", "title", "type", "createdAt", "updatedAt", "enabled", "startTime", "endTime"]);
        const [list, total] = await Promise.all([
            announceMgmtModel.aggregate({
                fields: announceMgmtFields,
                query,
                // 连表查询 创建人
                joins: [{
                    table: "system_user",
                    as: "user",
                    type: "left",
                    on: {
                        "user.id": announceMgmtModel.qualifyField("createUserId")
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
                group: [announceMgmtFields[0]],
                sort: { createdAt: "asc" },
                ...page,
            }),
            announceMgmtModel.count({ query })
        ])
        ctx.success({
            list,
            total
        });
    },
}