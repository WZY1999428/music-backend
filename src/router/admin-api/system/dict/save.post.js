import { dictTypeModel } from "@/database/model/system/dictionary.js"

export default {
    action: '编辑/新增字典',
    logType: 'EDIT_DICT',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id, title, remark, code, sort = 0, enabled = true } = ctx.request.body;
        $validate(title, "字典名称不能为空");
        $validate(code, "字典编码不能为空");
        const params = { title, remark, code, sort, enabled };
        let result = id ? dictTypeModel.update({ id }, params) : dictTypeModel.insert(params)
        result = await result.catch(err => err)
        if (id && result.affectedRows == 0) return ctx.fail("更新失败，数据不存在")
        if (result.code == "ER_DUP_ENTRY") return ctx.fail("字典名称已存在")
        ctx.success(null, id ? "更新成功" : "添加成功")
    },
}