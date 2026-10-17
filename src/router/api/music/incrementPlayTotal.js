import { songModel } from "@/database/model/music/song"

export default {
    action: '增加音乐播放量',
    logType: 'INCREMENT_PLAY_TOTAL',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { songId } = ctx.request.body;
        $validate(songId, "歌曲id不能为空")
        const result = await songModel.updateOne({ id: songId }, { $inc: { playTotal: 1 } })
        if (!result) {
            ctx.fail("更新失败");
            return;
        }
        ctx.success();
    },
}