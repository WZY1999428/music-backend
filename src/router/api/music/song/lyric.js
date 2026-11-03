import { songLyricModel } from "@/database/model/music/song.js"
export default {
    action: '获取歌词',
    logType: 'GET_SONG_LYRIC',
    auth: false,
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { songId } = ctx.request.query;

        $validate(songId, "歌曲id不能为空")
        const songLyrics = await songLyricModel.findMany({ songId }, {
            fields: ["id", "title", "songId", "lang", "content"]
        })
        ctx.success(songLyrics)
    },
}