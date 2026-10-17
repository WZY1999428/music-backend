import uploadModel from "@/database/model/upload.js";
import { songModel, songArtistModel, songAudioModel, songTypeModel } from "@/database/model/music/song.js";
import { formatUploadFileRef } from "@/utils/parse.js";
export default {
    action: '获取歌曲详情',
    enableLog: false,
    logType: 'GET_MUSIC_SONG_DETAIL',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        const song = await songModel.findOne({ id })
        if (!song) return ctx.fail("歌曲不存在")
        const ids = [song.cover, song.mvUrl].filter(Boolean)
        const songAudioFields = songAudioModel.qualifyFields(["id", "songId", "fileId", "duration", "format", "quality", "bitrate", "sampleRate", "bitDepth"])

        const [files, artis, songTypes, audioList,] = await Promise.all([
            uploadModel.findMany({ id: { $in: ids } }),
            songArtistModel.findMany({ songId: id }, { fields: ["artistId"] }),
            songTypeModel.findMany({ songId: id }, { fields: ["type"] }),
            songAudioModel.aggregate({
                query: { songId: id },
                fields: songAudioFields,
                joins: [{
                    table: uploadModel.table,
                    as: "upload",
                    type: "left",
                    on: {
                        "upload.id": songAudioModel.qualifyField("fileId")
                    },
                    select: [
                        {
                            type: "raw",
                            fields: {
                                "url": "upload.url",
                                "filename": "upload.filename"
                            }
                        }
                    ]
                }]
            })
        ])
        song.cover = formatUploadFileRef(files, song.cover)
        song.mvUrl = formatUploadFileRef(files, song.mvUrl)
        song.singerList = artis.map(item => item.artistId)
        song.songTypes = songTypes.map(item => item.type)
        song.audioList = audioList
        ctx.success(song)
    },
}

