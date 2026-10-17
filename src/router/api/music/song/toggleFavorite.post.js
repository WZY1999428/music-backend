import { favoriteSongModel, songModel } from "@/database/model/music/song"

export default {
    action: '切换歌曲收藏',
    logType: 'TOGGLE_SONG_FAVORITE',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { songId } = ctx.request.body;
        $validate(songId, "歌曲id不能为空")
        const userId = ctx.user.userId
        const msg = await favoriteSongModel.withTransaction(async (model) => {
            const favorite = await model.findOne({ songId, userId: userId })
            if (favorite) {
                await model.deleteOne({ id: favorite.id })
                await songModel.updateOne({ id: songId }, { $dec: { favoriteCount: 1 } })
                return "取消收藏成功"
            } else {
                await model.insertOne({ songId, userId: userId })
                await songModel.updateOne({ id: songId }, { $inc: { favoriteCount: 1 } })
                return "收藏成功"
            }
        })
        ctx.success(msg)
    }
}