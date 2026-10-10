import { albumModel } from "@/database/model/music/album.js";
import uploadModel from "@/database/model/upload.js";
import { parseJsonToArray } from "@/utils/parse.js";
export default {
    action: '获取专辑列表',
    logType: 'GET_MUSIC_ALBUM_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { title, code, pageIndex, pageSize } = ctx.request.query;
        const query = {}
        if (title && title.trim()) query.title = { $like: `%${title.trim()}%` }
        if (code) query.code = { $eq: code };
        const page = paginate(pageIndex, pageSize);
        
        const fields = albumModel.qualifyFields(["id", "title", "cover", "releaseDate", "company", "type", "genre", "sort", "isHot", "enabled"])
        const [list, total] = await Promise.all([
            albumModel.aggregate({
                fields,
                query,
                // 连表查询 创建人
                joins: [
                    {
                        table: "system_user",
                        as: "user",
                        type: "left",
                        on: {
                            "user.id": albumModel.qualifyField("createUserId")
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
                            "upload.id": albumModel.qualifyField("cover")
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
            albumModel.count({ query })
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