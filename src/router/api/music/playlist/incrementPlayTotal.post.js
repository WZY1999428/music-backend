import { playlistStatsModel } from "@/database/model/music/playlist"

export default {
    action: '增加音乐播放量',
    logType: 'INCREMENT_PLAY_TOTAL',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { playlistId } = ctx.request.body;
        $validate(playlistId, "歌单id不能为空")
        await playlistStatsModel.updateOne({ playlistId }, { $inc: { playTotal: 1 } })
        ctx.success();
    },
}