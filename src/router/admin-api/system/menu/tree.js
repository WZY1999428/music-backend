import routeModel, { menuPermissionsModel } from "@/database/model/system/menu.js"

export default {
    action: '获取路由树',
    logType: 'GET_ROUTE_TREE',
    /** @type {Controller} */
    handler: async (ctx) => {
        const [routes, permissions] = await Promise.all([routeModel.findMany({ enabled: { $eq: 1 } }), menuPermissionsModel.findMany({})])
        const newRoutes = []
        for (const route of routes) {
            const obj = { id: route.id, parentId: route.parentId, title: route.title, type: route.type };
            const children = []
            for (let i = 0; i < permissions.length; i++) {
                const permission = permissions[i];
                if (permission.routeId === route.id) {
                    children.push({
                        id: `permission_${permission.id}`,
                        title: permission.name,
                        permission: permission.permission,
                        parentId: permission.routeId,
                        type: 2
                    });
                    permissions.splice(i, 1)
                    i--;
                }
            }
            if (children.length) {
                obj.children = children;
            }
            newRoutes.push(obj)
        }

        ctx.success(listToTree(newRoutes));
    },
}