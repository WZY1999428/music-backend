import { dictTypeModel, dictItemModel } from "@/database/model/system/dictionary.js"
export default {
    action: '获取字典内容',
    logType: 'GET_DICTIONARY',
    /** @type {Controller} */
    handler: async (ctx) => {
        const fields = dictTypeModel.qualifyFields(["id", "code", "sort"])
        const dictItemFields = dictItemModel.qualifyFields(["id", "title", "value", "extData", "sort", "remark"])
        const result = await dictTypeModel.aggregate({
            fields,
            group: [fields[0]],
            joins: [
                {
                    table: dictItemModel.table,
                    as: dictItemModel.table,
                    type: "left",
                    on: {
                        [fields[0]]: dictItemModel.qualifyField("dictId")
                    },
                    select: [
                        {
                            type: "jsonArray",
                            as: "dictItems",
                            fields: {
                                "id": dictItemFields[0],
                                "title": dictItemFields[1],
                                "value": dictItemFields[2],
                                "extData": dictItemFields[3],
                                "sort": dictItemFields[4],
                                "remark": dictItemFields[5],
                            }
                        }
                    ]
                }
            ]
        })
        ctx.success(result);
    },
}