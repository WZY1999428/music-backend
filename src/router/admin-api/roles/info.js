import { roleModel } from "@/database/model/permission/role.js"

/** @type {Controller} */

export default async (ctx) => {
    const { id } = ctx.request.query;
    $validate(id, "角色id不能为空");
    const roleinfo = await roleModel.findOne({ id })
    $validate(roleinfo, "角色不存在")
    ctx.success(roleinfo, "获取信息成功");
}