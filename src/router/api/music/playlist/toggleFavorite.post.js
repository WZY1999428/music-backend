import { favoritePlaylistModel, playlistStatsModel } from "@/database/model/music/playlist"

export default {
    action: '切换歌单收藏',
    logType: 'TOGGLE_PLAYLIST_FAVORITE',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { playlistId } = ctx.request.body;
        $validate(playlistId, "歌单id不能为空")
        const userId = ctx.user.userId
        const msg = await favoritePlaylistModel.withTransaction(async (model) => {
            const favorite = await model.findOne({ playlistId, userId: userId })
            if (favorite) {
                await model.deleteOne({ id: favorite.id })
                await playlistStatsModel.updateOne({ playlistId }, { $dec: { favoriteTotal: 1 } })
                return "取消收藏成功"
            } else {
                await model.insertOne({ playlistId, userId: userId })
                await playlistStatsModel.updateOne({ playlistId }, { $inc: { favoriteTotal: 1 } })
                return "收藏成功"
            }
        })
        ctx.success(msg)
    }
}