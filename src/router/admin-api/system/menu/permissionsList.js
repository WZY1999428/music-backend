import { menuPermissionsModel } from "@/database/model/system/menu.js";
export default {
    action: '保存菜单权限按钮',
    logType: 'SAVE_MENU_PERMISSION',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { pageIndex = 1, pageSize = 20, routeId } = ctx.request.query
        const page = paginate(pageIndex, pageSize);
        $validate(routeId, "路由id不能为空")
        ctx.success({
            list: await menuPermissionsModel.findMany({ routeId }, { ...page }),
            total: await menuPermissionsModel.count({ query: { routeId } })
        })
    },
}