import { songAudioModel } from "@/database/model/music/song.js";
import { dictItemModel, dictTypeModel } from "@/database/model/system/dictionary.js"
import uploadModel from "@/database/model/upload.js"
export default {
    action: '获取音乐质量',
    logType: 'GET_SONG_QUALITY',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { songId } = ctx.request.query;
        const qualityField = songAudioModel.qualifyField("quality")
        const result = await songAudioModel.aggregate({
            fields: songAudioModel.qualifyFields(["id", "songId", "fileId", "duration", "format", "quality", "bitrate", "sampleRate"]),
            query: {
                [songAudioModel.qualifyField("songId")]: songId,
            },
            joins: [{
                table: uploadModel.table,
                as: "upload",
                on: { "upload.id": songAudioModel.qualifyField("fileId") },
                select: [
                    {
                        type: "raw",
                        fields: {
                          "originalName":"upload.originalName",
                          "filename":"upload.filename",
                          "url":"upload.url"
                        }
                    }
                ]
            },
            {
                table: dictTypeModel.table,
                as: 'dictType',
                on: { "dictType.code": { $eq: "AUDIO_QUALITY" } },
            },
            {
                table: dictItemModel.table,
                as: 'dictItem',
                type: "left",
                on: { "dictItem.dictId": "dictType.id", "dictItem.value": qualityField },
                select: [{
                    type: "raw",
                    fields: { "qualityTitle": "dictItem.title", "qualityId": "dictItem.id" }
                }]
            }
            ],
            group: [songAudioModel.qualifyField("id"), "dictItem.title", "dictItem.value", "dictItem.id"]
        })

        ctx.success(result);
    },
}