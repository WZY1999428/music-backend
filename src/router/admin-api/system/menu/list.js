import routeModel from "@/database/model/system/menu.js"

/** @type {Controller} */
export default async (ctx) => {
    const { pageIndex = 1, pageSize = 20, name, path } = ctx.request.query
    const query = {};
    if (name) query.name = { $like: `%${name}%` };
    if (path) query.path = { $like: `%${path}%` }
    const result = await routeModel.aggregate({
        query,
        fields: [
            "menus.id",
            "menus.parentId",
            "menus.title",
            "menus.type",
            "menus.icon",
            "menus.path",
            "menus.component",
            "menus.sort",
            "menus.isLink",
            "menus.enabled",
        ],
        jsonArrayAgg: [
            {
                as: "permissions",
                fields: {
                    "id": "permissions.id",
                    "name": "permissions.name",
                    "sort": "permissions.sort",
                    "enabled": "permissions.enabled",
                },
                case: {
                    $whens: [
                        { when: { "permissions.id": { $ne: null } } }
                    ]
                }
            }
        ],
        joins: [{
            table: "menu_permissions",
            type: "left",
            as: "permissions",
            on: { "permissions.menuId": "menus.id" }

        }],
        group: ["menus.id"],
        limit: pageSize,
        offset: (pageIndex - 1) * pageSize
    })

    const treeMap = new Map();
    result.forEach(t => treeMap.set(t.id, t));
    const rootTree = []
    for (const item of result) {
        item.permissions = item.permissions.filter(Boolean)
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
    ctx.success(rootTree)
}