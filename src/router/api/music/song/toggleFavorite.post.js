import { favoriteSongModel, songModel } from "@/database/model/music/song.js"

export default {
    action: '切换歌曲收藏',
    logType: 'TOGGLE_SONG_FAVORITE',
    auth: true,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { songId } = ctx.request.body;
        $validate(songId, "歌曲id不能为空")
        const userId = ctx.appUser.userId
        const favorite = await favoriteSongModel.findOne({ songId, userId: userId })
        const status = await favoriteSongModel.withTransaction(async (model) => {
            if (favorite) {
                await model.deleteOne({ id: favorite.id })
                await songModel.updateOne({ id: songId }, { $dec: { favoriteTotal: 1 } })
                return false
            } else {
                await model.insertOne({ songId, userId: userId })
                await songModel.updateOne({ id: songId }, { $inc: { favoriteTotal: 1 } })
                return true
            }
        })
        ctx.success(status)
    }
}