import { songModel } from "@/database/model/music/song.js";
import uploadModel from "@/database/model/upload.js";
export default {
    action: '获取歌曲列表',
    logType: 'GET_MUSIC_SONG_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { title, code, pageIndex, pageSize } = ctx.request.query;
        const query = {}
        if (title && title.trim()) query.title = { $like: `%${title.trim()}%` }
        if (code) query.code = { $eq: code };
        const page = paginate(pageIndex, pageSize);
        const fields = songModel.qualifyFields(["id", "title", "cover", "enabled", "publishDate", "updatedAt", "enabled"]);
        const [list, total] = await Promise.all([
            songModel.aggregate({
                fields,
                query,
                // 连表查询 创建人
                joins: [
                    {
                        table: "system_user",
                        as: "user",
                        type: "left",
                        on: {
                            "user.id": songModel.qualifyField("createUserId")
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
                            "upload.id": songModel.qualifyField("cover")
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
            songModel.count({ query })
        ])
        ctx.success({
            list,
            total
        });
    },
}