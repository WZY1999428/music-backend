import { dictItemModel } from "@/database/model/system/dictionary.js"
export default {
    action: '删除字典内容',
    logType: 'DELETE_DICT_ITEM',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "id不能为空")
        const result = await dictItemModel.deleteOne({ id })
        result.affectedRows > 0 ? ctx.success(null, "删除成功") : ctx.fail("删除失败,数据不存在")
    },
}