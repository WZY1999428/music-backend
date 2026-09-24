import { dictItemModel } from "@/database/model/system/dictionary.js"


export default {
    action: '编辑/新增字典内容',
    logType: 'EDIT_DICT_ITEM',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id, dictId, title, value, extData, remark, sort = 0, enabled = true } = ctx.request.body;
        $validate(dictId, "字典类型ID不能为空");
        $validate(title, "字典名称不能为空");
        $validate(value, "值不能为空");

        const params = { remark, dictId, title, value, extData, sort, enabled };
        let result = id ? dictItemModel.updateOne({ id }, params) : dictItemModel.insertOne(params)

        result = await result.catch(err => err)

        if (id && result.affectedRows == 0) return ctx.fail("更新失败，数据不存在")
        if (result.code == "ER_DUP_ENTRY") return ctx.fail("字典值名称已存在")
        else if (result.code) throw new Error(result.message)
        ctx.success(null, id ? "更新成功" : "添加成功")
    },
}  