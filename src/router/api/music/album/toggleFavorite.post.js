
import { albumModel, favoriteArostModel } from "@/database/model/music/album.js"
export default {
    action: '切换专辑收藏', 
    logType: 'TOGGLE_ALBUM_FAVORITE',
    enableLog: false,
    auth: true,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { albumId } = ctx.request.body;
        $validate(albumId, "专辑id不能为空")
        const userId = ctx.appUser.userId
        
        const favorite = await favoriteArostModel.findOne({ albumId, userId: userId })
        const status = await favoriteArostModel.withTransaction(async (model) => {
            if (favorite) {
                await model.deleteOne({ id: favorite.id })
                await albumModel.updateOne({ id: albumId }, { $dec: { favoriteTotal: 1 } })
                return false
            } else {
                await model.insertOne({ albumId, userId: userId })
                await albumModel.updateOne({ id: albumId }, { $inc: { favoriteTotal: 1 } })
                return true
            }
        })
        ctx.success(status)
    }
}