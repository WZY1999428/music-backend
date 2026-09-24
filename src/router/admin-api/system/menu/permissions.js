import { menuPermissionsModel, apiModel } from "@/database/model/system/menu.js";
export default {
    action: '保存菜单权限按钮',
    logType: 'SAVE_MENU_PERMISSION',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "权限Id不能为空")
        const [data, apiData] = await Promise.all([menuPermissionsModel.findOne({ id }), apiModel.findMany({ permissionsId: id })])
        data.apiList = apiData.map(item => `${item.method} : ${item.path}`)
        ctx.success(data)
    },
}