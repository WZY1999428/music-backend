import { playlistModel } from "@/database/model/music/playlist.js";
import uploadModel from "@/database/model/upload.js";
import { parseJsonToArray } from "@/utils/parse.js";
export default {
    action: '获取歌单列表',
    logType: 'GET_MUSIC_PLAYLIST_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { title, code, pageIndex, pageSize } = ctx.request.query;
        const query = {}
        if (title && title.trim()) query.title = { $like: `%${title.trim()}%` }
        if (code) query.code = { $eq: code };
        const page = paginate(pageIndex, pageSize);
        const fields = playlistModel.qualifyFields(["id", "title", "cover", "sort", "isHot", "enabled", "description", "createdAt", "updatedAt"])
        const [list, total] = await Promise.all([
            playlistModel.aggregate({
                fields,
                query,
                // 连表查询 创建人
                joins: [
                    {
                        table: "system_user",
                        as: "user",
                        type: "left",
                        on: {
                            "user.id": playlistModel.qualifyField("createUserId")
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
                            "upload.id": playlistModel.qualifyField("cover")
                        },
                        select: [
                            {
                                type: "raw",
                                fields: {
                                    "cover": "upload.url"
                                }
                            }
                        ]
                    }],
                sort: { createdAt: "asc" },
                ...page,
            }),
            playlistModel.count({ query })
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