
import { rolePermissionModel } from "@/database/model/system/role.js";

export default {
    action: '获取角色权限',
    logType: 'GET_ROLE_PERMISSIONS',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { roleId } = ctx.request.query;
        $validate(roleId, "角色id不能为空")
        const rolePermissions = await rolePermissionModel.findMany({ roleId })
        const list = rolePermissions.map(item => {
            if (item.permissionId) {
                return `permission_${item.permissionId}`
            }
            return item.routeId
        })
        ctx.success(list)
    },
}