import { dictTypeModel } from "@/database/model/system/dictionary.js"

/** @type {Controller} */
export default async (ctx) => {
    const { id } = ctx.request.params;
    const dictType = await dictTypeModel.findOne({ id })
    if (!dictType) {
        return ctx.fail("字典类型不存在")
    }
    ctx.success(dictType)
} 
