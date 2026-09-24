import artistModel from "@/database/model/music/artist.js";
import uploadModel from "@/database/model/upload.js";

export default {
    action: '获取歌手列表',
    logType: 'GET_MUSIC_ARTIST_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { title, code, pageIndex, pageSize } = ctx.request.query;
        const query = {}
        if (title && title.trim()) query.title = { $like: `%${title.trim()}%` }
        if (code) query.code = { $eq: code };
        const page = paginate(pageIndex, pageSize);
        const fields = artistModel.qualifyFields(["id", "name", "realName", "gender", "area", "isHot", "updatedAt", "enabled"]);
        const [list, total] = await Promise.all([
            artistModel.aggregate({
                fields,
                query,
                // 连表查询 创建人
                joins: [{
                    table: "system_user",
                    as: "user",
                    type: "left",
                    on: {
                        "user.id": artistModel.qualifyField("createUserId")
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
                },
                {
                    table: uploadModel.table,
                    as: "upload",
                    type: "left",
                    on: {
                        "upload.id": artistModel.qualifyField("avatar")
                    },
                    select: [
                        {
                            type: "raw",
                            fields: {
                                "avatar": "upload.url"
                            }
                        }
                    ]
                }],
                sort: { createdAt: "asc" },
                ...page,
            }),
            artistModel.count({ query })
        ])
        ctx.success({
            list,
            total
        });
    },
}