import { dictTypeModel, dictItemModel } from "@/database/model/system/dictionary.js"

/** @type {Controller} */
export default async (ctx) => {
    const { id } = ctx.request.body;
    $validate(id, "id不能为空")
    const result = await dictTypeModel.withTransaction(async model => {
        await dictItemModel.deleteMany({ parentId: id })
        return await model.deleteOne({ id })
    })

    if (result.affectedRows > 0) {
        ctx.success(null, "删除成功")
    } else {
        ctx.fail(null, "删除失败数据不存在")
    }
}