import routeModel, { menuPermissionsModel } from "@/database/model/system/menu.js"
import { rolePermissionModel } from "@/database/model/system/role.js"

export default {
    action: '获取菜单路由',
    logType: 'GET_MENU_ROUTES',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const roleId = ctx.user.roleId;
        const isSuperAdmin = ctx.user.isSuperAdmin;
        const tasks = [];
        let rolePermissions = []
        const routeQuery = { enabled: { $eq: 1 } };
        if (!isSuperAdmin) {
            rolePermissions = await rolePermissionModel.findMany({ roleId: { $eq: roleId } }, {
                fields: ['routeId', "permissionId"] // 只查询需要的字段
            })
            const routeIds = rolePermissions.filter(item => item.permissionId === null).map(item => item.routeId);
            if (!routeIds.length) {
                return ctx.success({ rouets: [], permissions: [] })
            }
            routeQuery.id = { $in: routeIds }
        }

        tasks.push(routeModel.findMany(routeQuery, {
            fields: ['id', 'parentId', 'title', 'icon', 'path', 'component', 'isLink', 'enabled', 'type', 'visible'],
            sort: { sort: "asc" }
        }))


        const permissionsQuery = {}
        if (!isSuperAdmin) {
            const permissionsIds = rolePermissions.filter(item => item.permissionId !== null).map(item => item.permissionId);
            if (permissionsIds.length) permissionsQuery.id = { $in: permissionsIds }
        }

        tasks.push(menuPermissionsModel.findMany(permissionsQuery, {
            fields: ['id', 'name', 'permission']
        }))


        const [result, permissions = []] = await Promise.all(tasks);

        const treeMap = new Map();
        result.forEach(t => treeMap.set(t.id, t));
        const rootTree = []
        for (const item of result) {
            const parent = treeMap.get(item.parentId);
            if (parent) {
                if (!parent.children) {
                    parent.children = [item];
                } else {
                    parent.children.push(item);
                }
            } else {
                rootTree.push(item)
            }
        }

        ctx.success({ rouets: rootTree, permissions: permissions.map(item => item.permission) })
    },
}