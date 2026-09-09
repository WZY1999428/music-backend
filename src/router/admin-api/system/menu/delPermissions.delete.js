import { menuPermissionsModel } from "@/database/model/system/menu.js";
export default {
    action: '删除菜单权限按钮',
    logType: 'DELETE_MENU_PERMISSION',
    /** @type {Controller} */
    handler: async (ctx) => {
        const id = ctx.request.query.id;
        $validate(id, "权限按钮ID不能为空");
        const result = await menuPermissionsModel.deleteOne({ id })
        if (result.affectedRows > 0) {
            ctx.success(null, "删除成功")
        } else {
            ctx.success(null, "删除失败数据不存在")
        }
    },
}