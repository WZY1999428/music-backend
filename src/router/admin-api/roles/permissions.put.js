import { roleModel, rolePermissionModel } from "@/database/model/permission/role.js";
import routeModel, { menuPermissionsModel } from "@/database/model/system/menu.js";

export default {
    action: '更新角色权限',
    logType: 'UPDATE_ROLE_PERMISSIONS',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { roleId, permissions = [] } = ctx.request.body;
        // 1. 参数校验
        $validate(roleId, "角色id不能为空");

        const existingRole = await roleModel.findOne({ id: roleId });
        $validate(existingRole, "角色不存在");

        await rolePermissionModel.withTransaction(async (model) => {
            // 2. 并行查询现有权限及关联基础表，提高读取速度
            const [existingPermissions, menuPermissions, routes] = await Promise.all([
                model.findMany({ roleId }),
                menuPermissionsModel.findMany(),
                routeModel.findMany()
            ]);

            // 3. 构建快速查找的 Set 集合
            const validMenuPermissionIds = new Set(menuPermissions.map(item => item.id));
            const validRouteIds = new Set(routes.map(item => item.id));

            // Map key 格式设计：routeId_permissionId_permissionType 作为唯一标识
            const existingMap = new Map(existingPermissions.map(item => [buildMapkey(item), item.id]));

            const toInsert = [];
            const incomingKeys = new Set();

            // 4. 遍历传入的权限，计算待新增的数据
            for (const permission of permissions) {
                let { routeId, permissionId, permissionType = 1 } = permission;
                // 基础数据合法性校验
                if (routeId) routeId = parseInt(routeId)
                if (permissionId) permissionId = parseInt(permissionId)
                else permissionId = null;
                const isInvalidMenu = permissionType == 2 && !validMenuPermissionIds.has(permissionId);
                const isInvalidRoute = permissionType == 1 && !validRouteIds.has(routeId);

                if (isInvalidMenu || isInvalidRoute) continue;

                const key = buildMapkey(permission);
                incomingKeys.add(key);
                // 如果旧数据中不存在，则放入新增队列
                if (!existingMap.has(key)) {
                    toInsert.push({ roleId, routeId, permissionId, permissionType });
                }
            }

            // 5. 计算需要删除的数据库旧纪录 ID
            const toDeleteIds = [];
            for (const [key, id] of existingMap.entries()) {
                if (!incomingKeys.has(key)) {
                    toDeleteIds.push(id);
                }
            }

            // 6. 批量操作数据库（极大地提升写入性能）
            if (toInsert.length > 0) {
                await model.insertMany(toInsert);
            }

            if (toDeleteIds.length > 0) {
                await model.deleteMany({ id: { $in: toDeleteIds } });
            }
        });

        ctx.success();
    },
};

function buildMapkey(item) {
    return `${item.routeId}_${item.permissionId}_${item.permissionType}`;
}

