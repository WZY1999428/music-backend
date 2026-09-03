import routeModel, { menuPermissionsModel } from "@/database/model/system/menu.js";

/** @type {Controller} */
export default async (ctx) => {
    const { id } = ctx.request.params;
    const menu = await routeModel.findOne({ id })
    if (!menu) {
        return ctx.fail("菜单不存在")
    }
    const permissions = await menuPermissionsModel.findMany({ menuId: id })
    menu.permissions = permissions
    ctx.success(menu)
} 
