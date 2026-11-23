import { dictItemModel, dictTypeModel } from "@/database/model/system/dictionary.js"
import artistModel from "@/database/model/music/artist.js"

export default {
    action: '地区歌手统计',
    enableLog: false,
    logType: 'REGION_STATISTICS',
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
                    on: { "dictType.code": { $eq: "ARTIST_REGION" }, [dictItemModel.qualifyField("dictId")]: "dictType.id" }
                },
                {
                    table: artistModel.table,
                    as: "artist",
                    type: "left",
                    on: { "artist.area": dictItemModel.qualifyField("value") },
                    select: [{ type: "raw", fields: { "total": "COUNT(artist.id)" } }]
                }
            ],
            sort: { "total": "desc" },
            group: fields
        })

        ctx.success(result);
    },
}