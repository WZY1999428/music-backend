import routeModel, { menuPermissionsModel } from "@/database/model/system/menu.js";

export default {
    action: '获取菜单信息',
    logType: 'GET_MENU_INFO',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        const menu = await routeModel.findOne({ id })
        if (!menu) {
            return ctx.fail("菜单不存在")
        }
        const permissions = await menuPermissionsModel.findMany({ menuId: id })
        menu.permissions = permissions
        ctx.success(menu)
    },
} 
