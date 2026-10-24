
import { songModel } from "@/database/model/music/song"
import artistModel from "@/database/model/music/artist"

export default {
    action: 'APP搜索音乐',
    logType: 'APP_SEARCH_MUSIC',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { keyword } = ctx.request.body;
        $validate(keyword, "搜索关键词不能为空");
        const like = `%${keyword}%`

        // const artists = await artistModel.find(
        //     { name: { $like: like } }
        // )

        // const songs = await songModel.execute()
        ctx.success([]);
    },
}