import { dictTypeModel, dictItemModel } from "@/database/model/system/dictionary.js"

export default {
    action: '删除字典信息',
    logType: 'DELETE_DICT_INFO',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "id不能为空")
        const result = await dictTypeModel.withTransaction(async model => {
            await dictItemModel.deleteMany({ parentId: id })
            return await model.deleteOne({ id })
        })

        if (result.affectedRows > 0) {
            ctx.success(null, "删除成功")
        } else {
            ctx.fail("删除失败,数据不存在")
        }
    },
}