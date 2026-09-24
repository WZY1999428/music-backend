import routeModel from "@/database/model/system/menu.js"

export default {
    action: '获取菜单选项',
    logType: 'GET_MENU_OPTIONS',
    /** @type {Controller} */
    handler: async (ctx) => {
        let result = await routeModel.findMany({ type: 0, visible: 1 }, { sort: { sort: 'asc' } });
        result = result.map(item => ({ value: item.id, label: item.title, parentId: item.parentId }));
        const treeMap = new Map(result.map(item => [item.value, item]));
        const rootTree = [];
        for (const item of result) {
            const parent = treeMap.get(item.parentId);
            if (parent) {
                parent.children ??= [];
                parent.children.push(item);
            } else {
                rootTree.push(item);
            }
        }
        ctx.success(rootTree);
    },
}