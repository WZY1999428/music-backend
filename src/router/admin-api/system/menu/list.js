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
                as: "buttons",
                fields: {
                    "id": "menuButtons.id",
                    "name": "menuButtons.name",
                    "sort": "menuButtons.sort",
                    "enabled": "menuButtons.enabled",
                },
                case: {
                    $whens: [
                        { when: { "menuButtons.id": { $ne: null } } }
                    ]
                }
            }
        ],
        joins: [{
            table: "menu_buttons",
            type: "left",
            as: "menuButtons",
            on: { "menuButtons.menuId": "menus.id" }

        }],
        group: ["menus.id"],
        limit: pageSize,
        offset: (pageIndex - 1) * pageSize
    })

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
    ctx.success(rootTree)
}