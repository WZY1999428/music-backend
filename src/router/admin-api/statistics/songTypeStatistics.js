import { dictItemModel, dictTypeModel } from "@/database/model/system/dictionary.js"
import { songTypeModel } from "@/database/model/music/song.js"

export default {
    action: '音乐类型统计',
    enableLog: false,
    logType: 'SONG_TYPE_STATISTICS',
    /** @type {Controller} */
    handler: async (ctx) => {
        const fields = dictItemModel.qualifyFields(["title", "value"]);
        const result = await dictItemModel.aggregate({
            query: {
                [dictItemModel.qualifyField("enabled")]: 1
            },
            fields,
            joins: [
                {
                    table: dictTypeModel.table,
                    as: "dictType",
                    on: { "dictType.code": { $eq: "MUSIC_CATEGORY" }, [dictItemModel.qualifyField("dictId")]: "dictType.id" }
                },
                {
                    table: songTypeModel.table,
                    as: "songType",
                    type:"left",
                    on: { "songType.type": dictItemModel.qualifyField("value") },
                    select: [{ type: "raw", fields: { "total": "COUNT(songType.songId)" } }]
                }
            ],
            sort: { "total": "asc" },
            group: fields
        })

        ctx.success(result);
    },
}