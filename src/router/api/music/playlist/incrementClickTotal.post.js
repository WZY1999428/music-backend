import { playlistStatsModel } from "@/database/model/music/playlist"

export default {
    action: '增加歌单点击量',
    logType: 'INCREMENT_PLAYLIST_CLICK_TOTAL',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { playlistId } = ctx.request.body;
        $validate(playlistId, "歌单id不能为空")
        await playlistStatsModel.updateOne({ playlistId }, { $inc: { clickTotal: 1 } })
        ctx.success();
    },
}