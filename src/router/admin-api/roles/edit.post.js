
import { roleModel } from "@/database/model/permission/role.js"

/** @type {Controller} */
export default async (ctx) => {
    const { id, name, sort = 0, enabled = true } = ctx.request.body;
    $validate(name, "角色名称不能为空");
    if (await roleModel.findOne({ name })) {
        return ctx.fail("角色名称已存在");
    }
    id ? await roleModel.update({ id, name, sort, enabled }) : await roleModel.insert({ name: name.trim(), sort, enabled })
    ctx.success(null, id ? "更新成功" : "添加成功")
}



