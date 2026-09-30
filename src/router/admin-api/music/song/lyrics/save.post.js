import { songLyricModel, songModel } from "@/database/model/music/song.js";
export default {
    action: '保存歌词',
    logType: 'SAVE_MUSIC_SONG_LYRIC',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id, title, songId, lang, content, sort, format = "lrc", enabled = 1 } = ctx.request.body;
        $validate(songId, "歌曲ID不能为空")
        $validate(title, "歌词标题不能为空")
        $validate(lang, "语言不能为空")
        $validate(content, "歌词内容不能为空")
        $validate(sort, "排序不能为空")
        $validate(format, "格式不能为空")

        const song = await songModel.findOne({ id: songId })
        $validate(song, "添加失败歌曲不存在")
        const params = {
            songId,
            title,
            lang,
            content,
            sort,
            format,
            enabled,
        }

        id ? await songLyricModel.updateOne({ id }, params) : await songLyricModel.insertOne(params)
        ctx.success()
    },
}


