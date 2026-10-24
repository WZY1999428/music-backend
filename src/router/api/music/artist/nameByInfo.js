
import artistModel from "@/database/model/music/artist.js"
export default {
    action: 'APP获取根据名称获取歌手信息',
    logType: 'APP_GET_ARTIST_NAME_BY_INFO',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { name } = ctx.request.query;
        const artist = await artistModel.findOne({ name })
        if (artist) {
            ctx.success(artist)
        } else {
            ctx.fail('歌手不存在')
        }
    },
}