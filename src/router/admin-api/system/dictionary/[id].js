import { dictTypeModel } from "@/database/model/system/dictionary.js"


export default {
    action: '获取字典信息',
    logType: 'GET_DICT_INFO',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        const dictType = await dictTypeModel.findOne({ id })
        if (!dictType) return ctx.fail("字典类型不存在")
        ctx.success(dictType)
    },
}