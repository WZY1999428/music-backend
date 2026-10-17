import { songModel, songArtistModel, songAudioModel, songTypeModel } from "@/database/model/music/song.js";
import { formatDate } from "@/utils/date.js";
export default {
    action: '保存歌曲',
    logType: 'SAVE_MUSIC_SONG',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id, title, cover, publishDate, singerList, audioList, songTypes, mvUrl, enabled = 1 } = ctx.request.body;
        $validate(title, "歌曲名称不能为空")
        $validate(cover, "歌曲封面不能为空")
        $validate(publishDate, "歌曲发布日期不能为空")

        if (!singerList || singerList.length === 0) {
            return ctx.fail("歌曲演唱者不能为空")
        }
        if (!cover || !cover.id) {
            return ctx.fail("歌曲封面不能为空")
        }
        try {
            await songModel.withTransaction(async (model) => {
                const params = {
                    title,
                    cover: cover.id,
                    mvUrl: mvUrl?.id,
                    publishDate: formatDate(publishDate),
                    enabled,
                    createUserId: ctx.user.userId
                }
                const result = id
                    ? await model.updateOne({ id }, params)
                    : await model.insertOne(params)

                const songId = result.insertId || id
                // 同步歌手
                await syncRelation({
                    model: songArtistModel,
                    oldList: await songArtistModel.findMany({ songId }),
                    list: singerList,
                    key: 'artistId',
                    createInsertData: (artistId) => ({ songId, artistId })
                })
                // 同步音频
                await syncRelation({
                    model: songAudioModel,
                    oldList: await songAudioModel.findMany({ songId }),
                    list: audioList,
                    key: 'fileId',
                    createInsertData: (audio) => songAudioInfo(songId, audio)
                })

                // 同步歌曲类型
                await syncRelation({
                    model: songTypeModel,
                    oldList: await songTypeModel.findMany({ songId }),
                    list: songTypes,
                    key: 'type',
                    createInsertData: (type) => ({ songId, type })
                })
            })

            ctx.success(null, id ? "更新成功" : "添加成功")
        } catch (error) {
            if (error.code == "ER_DUP_ENTRY") return ctx.fail("协议编号已存在")
            ctx.fail(error.message)
        }
    },
}


function songAudioInfo(songId, audio) {
    const info = {
        songId,
        fileId: audio.fileId || null,
        duration: audio.duration || null,
        format: audio.format || null,
        quality: audio.quality || null,
        bitrate: audio.bitrate || null,
        sampleRate: audio.sampleRate || null,
        bitDepth: audio.bitDepth || null,
    }
    return info
}
