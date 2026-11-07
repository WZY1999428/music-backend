import artistModel, { artistFavoriteModel } from "@/database/model/music/artist.js"

export default {
    action: '切换歌手收藏',
    logType: 'TOGGLE_ARTIST_FAVORITE',
    enableLog: false,
    auth: true,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { artistId } = ctx.request.body;
        $validate(artistId, "歌手id不能为空")
        const userId = ctx.appUser.userId
        
        const favorite = await artistFavoriteModel.findOne({ artistId, userId: userId })
        const status = await artistFavoriteModel.withTransaction(async (model) => {
            if (favorite) {
                await model.deleteOne({ id: favorite.id })
                await artistModel.updateOne({ id: artistId }, { $dec: { favoriteTotal: 1 } })
                return false
            } else {
                await model.insertOne({ artistId, userId: userId })
                await artistModel.updateOne({ id: artistId }, { $inc: { favoriteTotal: 1 } })
                return true
            }
        })
        ctx.success(status)
    }
}