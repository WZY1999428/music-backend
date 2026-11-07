import { favoritePlaylistModel, playlistStatsModel } from "@/database/model/music/playlist.js"

export default {
    action: '切换歌单收藏',
    logType: 'TOGGLE_PLAYLIST_FAVORITE',
    enableLog: false,
    auth: true,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { playlistId } = ctx.request.body;
        $validate(playlistId, "歌单id不能为空")
        const userId = ctx.appUser.userId
        const favorite = await favoritePlaylistModel.findOne({ playlistId, userId: userId })
        const status = await favoritePlaylistModel.withTransaction(async (model) => {
            if (favorite) {
                await model.deleteOne({ id: favorite.id })
                await playlistStatsModel.updateOne({ playlistId }, { $dec: { favoriteTotal: 1 } })
                return false
            } else {
                await model.insertOne({ playlistId, userId: userId })
                await playlistStatsModel.updateOne({ playlistId }, { $inc: { favoriteTotal: 1 } })
                return true
            }
        })
        ctx.success(status)
    }
}