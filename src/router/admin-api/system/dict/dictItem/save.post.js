import { dictItemModel } from "@/database/model/system/dictionary.js"


export default {
    action: '编辑/新增字典内容',
    logType: 'EDIT_DICT_ITEM',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id, parentId, title, value, extData = null, sort = 0, enabled = true } = ctx.request.body;
        $validate(parentId, "字典类型ID不能为空");
        $validate(title, "字典名称不能为空");
        $validate(value, "值不能为空");

        const params = { title, remark, code, sort, enabled, extData };
        let result = id ? dictItemModel.update({ id }, params) : dictItemModel.insert(params)

        result = await result.catch(err => err)

        if (id && result.affectedRows == 0) return ctx.fail("更新失败，数据不存在")
        if (result.code == "ER_DUP_ENTRY") return ctx.fail("字典值名称已存在")

        ctx.success(null, id ? "更新成功" : "添加成功")
    },
}