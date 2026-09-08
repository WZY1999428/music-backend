
import { rolePermissionModel } from "@/database/model/permission/role.js";

/** @type {Controller} */
export default async (ctx) => {
    const { roleId } = ctx.request.query;
    $validate(roleId, "角色id不能为空")
    const rolePermissions = await rolePermissionModel.findMany({ roleId })
    ctx.success(rolePermissions)
}