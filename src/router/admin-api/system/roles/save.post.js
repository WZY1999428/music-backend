
import { roleModel } from "@/database/model/system/role.js"

export default {
    action: '编辑/新增角色',
    logType: 'EDIT_ROLE',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id, name, weight = 0, enabled = true } = ctx.request.body;
        $validate(name, "角色名称不能为空");
        if (!id && await roleModel.findOne({ name })) {
            return ctx.fail("角色名称已存在");
        }
        const parmas = { name: name.trim(), weight, enabled }
        id ? await roleModel.updateOne({ id }, parmas) : await roleModel.insertOne(parmas)
        ctx.success(null, id ? "更新成功" : "添加成功")
    },
}
