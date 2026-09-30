import { songLyricModel } from "@/database/model/music/song.js";

export default {
    action: '删除歌词',
    logType: 'DELETE_MUSIC_SONG_LYRIC',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "id不能为空")
        const result = await songLyricModel.deleteOne({ id })
        if (result.affectedRows === 0) {
            ctx.fail("歌手不存在");
            return;
        }
        ctx.success(null, "删除成功");
    },
}