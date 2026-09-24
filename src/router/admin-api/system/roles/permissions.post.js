import { roleModel, rolePermissionModel } from "@/database/model/system/role.js";
import { menuPermissionsModel } from "@/database/model/system/menu.js";

export default {
    action: '更新角色权限',
    logType: 'UPDATE_ROLE_PERMISSIONS',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { roleId, permissionIds = [] } = ctx.request.body;
        // 1. 参数校验
        $validate(roleId, "角色id不能为空");

        const existingRole = await roleModel.findOne({ id: roleId });
        $validate(existingRole, "角色不存在");
        await rolePermissionModel.withTransaction(async (model) => {
            const prefix = "permission_";

            const routeIds = permissionIds.filter(
                item => typeof item === "number" || !item.startsWith(prefix)
            );

            const btnPermissionIds = new Set(
                permissionIds
                    .filter(item =>
                        typeof item === "string" &&
                        item.startsWith(prefix)
                    )
                    .map(item => Number(item.replace(prefix, "")))
            );

            const [existingPermissions, menuPermissions] = await Promise.all([
                model.findMany({ roleId }),
                menuPermissionsModel.findMany()
            ]);

            const btnPermission = menuPermissions
                .filter(item => btnPermissionIds.has(item.id))
                .map(item => ({
                    routeId: item.routeId,
                    permissionId: item.id
                }));

            // ==================== 建立现有权限索引 ====================

            const existingBtnPermissionSet = new Set();
            const existingRoutePermissionSet = new Set();

            for (const item of existingPermissions) {
                if (item.permissionId) {
                    existingBtnPermissionSet.add(
                        `${item.routeId}:${item.permissionId}`
                    );
                } else {
                    existingRoutePermissionSet.add(item.routeId);
                }
            }

            // ==================== 新增 ====================

            const inserts = [];

            for (const item of btnPermission) {
                const key = `${item.routeId}:${item.permissionId}`;

                if (!existingBtnPermissionSet.has(key)) {
                    inserts.push({
                        roleId,
                        routeId: item.routeId,
                        permissionId: item.permissionId
                    });
                }
            }

            for (const routeId of routeIds) {
                if (!existingRoutePermissionSet.has(routeId)) {
                    inserts.push({
                        roleId,
                        routeId
                    });
                }
            }

            // ==================== 删除 ====================

            const btnPermissionSet = new Set(
                btnPermission.map(
                    item => `${item.routeId}:${item.permissionId}`
                )
            );

            const routePermissionSet = new Set(routeIds);

            const delIds = [];

            for (const permission of existingPermissions) {
                if (permission.permissionId) {
                    const key = `${permission.routeId}:${permission.permissionId}`;

                    if (!btnPermissionSet.has(key)) {
                        delIds.push(permission.id);
                    }

                    continue;
                }

                if (!routePermissionSet.has(permission.routeId)) {
                    delIds.push(permission.id);
                }
            }

            // ==================== 执行 ====================

            if (inserts.length) {
                await model.insertMany(inserts);
            }

            if (delIds.length) {
                await model.deleteMany({
                    id: {
                        $in: delIds
                    }
                });
            }
        });

        ctx.success();
    },
};

