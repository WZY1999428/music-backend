import routeModel from "@/database/model/system/menu.js"

export default {
    action: '获取菜单列表',
    logType: 'GET_MENU_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { pageIndex = 1, pageSize = 20, title, path } = ctx.request.query
        const query = {};
        if (title) query.title = { $like: `%${title}%` };
        if (path) query.path = { $like: `%${path}%` }
        const queryLen = Object.keys(query).length
        if (queryLen === 0) {
            query.parentId = { $eq: 0 };
        }

        const page = paginate(pageIndex, pageSize);

        const result = await routeModel.findMany({ ...query }, { ...page, sort: { sort: 'asc' } });

        let list = result;
        const treeMap = new Map(list.map(item => [item.id, item]));
        if (!queryLen && result.length) {
            const { parentId, ...treeQuery } = query;
            treeQuery.id = { $nin: result.map(item => item.id) };
            const children = await routeModel.findMany({ ...treeQuery }, { sort: { sort: 'asc' } });
            list = [...children, ...result];
        }
        const rootTree = [];
        for (const item of list) {
            const parent = treeMap.get(item.parentId);
            if (parent) {
                parent.children ??= [];
                parent.children.push(item);
            } else {
                rootTree.push(item);
            }
        }

        ctx.success({
            list: rootTree,
            total: !queryLen ? await routeModel.count({query}) : await countRootNodes(list)
        });
    },
}


