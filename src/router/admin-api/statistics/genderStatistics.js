import { dictItemModel, dictTypeModel } from "@/database/model/system/dictionary.js"
import artistModel from "@/database/model/music/artist.js"
export default {
    action: '歌手性别统计',
    logType: 'GENDER_STATISTICS',
    enableLog: false,
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
                    on: { "dictType.code": { $eq: "ARTIST_GENDER" }, [dictItemModel.qualifyField("dictId")]: "dictType.id" }
                },
                {
                    table: artistModel.table,
                    as: "artist",
                    type: "left",
                    on: { "artist.gender": dictItemModel.qualifyField("value") },
                    select: [{ type: "raw", fields: { "total": "COUNT(artist.id)" } }]
                }
            ],
            sort: { "total": "desc" },
            group: fields
        })

        ctx.success(result);
    },
}