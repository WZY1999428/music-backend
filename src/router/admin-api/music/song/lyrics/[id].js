import { songLyricModel } from "@/database/model/music/song.js";
export default {
    action: '获取歌词详情',
    enableLog: false,
    logType: 'GET_MUSIC_SONG_LYRIC_DETAIL',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        $validate(id, "歌词id不能为空")
        const lyric = await songLyricModel.findOne({ id })
        ctx.success(lyric)
    },
}

