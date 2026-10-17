import userModel from "@/database/model/app/user/user.js"
import userFavoriteModel from "@/database/model/app/user/userFavorite.js"
import userPlayHistoryModel from "@/database/model/app/user/userPlayHistory.js"
import userPlaylistModel from "@/database/model/app/user/userPlaylist.js"

export default {
    action: '删除app用户',
    logType: 'DELETE_APP_USER',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        const result = await userModel.withTransaction(async model => {
            // 先删除用户收藏
            await userFavoriteModel.deleteMany({ userId: id })
            // 再删除用户播放历史
            await userPlayHistoryModel.deleteMany({ userId: id })
            // 再删除用户歌单
            await userPlaylistModel.deleteMany({ userId: id })
            // 最后删除用户
            return await model.deleteOne({ id })
        })
        if (result.affectedRows == 0) {
            return ctx.fail("删除失败用户不存在")
        }
        ctx.success("删除成功")
    },
}