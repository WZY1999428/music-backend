import { userPlaylistModel } from "@/database/model/app/user/userPlaylist.js"
import uploadModel from "@/database/model/upload.js";
import appUserModel from "@/database/model/app/user/user.js"
export default {
    action: '获取用户创建歌单',
    logType: 'GET_USER_CREATE_PLAYLIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { userId, pageIndex = 1, pageSize = 10 } = ctx.request.query;
        const user = await appUserModel.findOne({ id: userId })
        if (!user) {
            ctx.fail("用户不存在")
            return
        }
        const fields = userPlaylistModel.qualifyFields()
        const [list, total] = await Promise.all([
            userPlaylistModel.aggregate({
                query: { [fields[1]]: userId },
                fields,
                joins: [{
                    table: uploadModel.table,
                    as: "upload",
                    type: "left",
                    on: { "upload.id": userPlaylistModel.qualifyField("cover") },
                    select: [{ type: "raw", fields: { "cover": "upload.url" } }]
                }],
                ...paginate(pageIndex, pageSize)
            }),
            userPlaylistModel.count({
                query: { [fields[1]]: userId },
            })
        ])
        ctx.success({ list, total })
    },
}
