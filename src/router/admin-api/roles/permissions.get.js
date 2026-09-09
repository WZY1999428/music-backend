
import { rolePermissionModel } from "@/database/model/permission/role.js";

export default {
    action: '获取角色权限',
    logType: 'GET_ROLE_PERMISSIONS',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { roleId } = ctx.request.query;
        $validate(roleId, "角色id不能为空")
        const rolePermissions = await rolePermissionModel.findMany({ roleId })
        ctx.success(rolePermissions)
    },
}