import { dictItemModel } from "@/database/model/system/dictionary.js"



export default {
    action: '获取字典内容信息',
    logType: 'GET_DICT_ITEM_INFO',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        const dictItem = await dictItemModel.findOne({ id })
        if (!dictItem) return ctx.fail("字典内容不存在")
        ctx.success(dictItem)
    },
}