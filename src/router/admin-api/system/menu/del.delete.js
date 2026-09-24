import routeModel, { menuPermissionsModel } from "@/database/model/system/menu.js";
export default {
    action: '删除菜单',
    logType: 'DELETE_MENU',
    /** @type {Controller} */
    handler: async (ctx) => {
        const id = ctx.request.query.id;
        console.log(id);
        $validate(id, "菜单ID不能为空");
        const total = await routeModel.count({
            query: { parentId: { $eq: id } }
        })
        console.log(total);
        if (total > 0) return ctx.fail("删除失败，当前菜单存在子菜单")
        const result = await routeModel.withTransaction(async (model) => {
            const deleteResult = await model.deleteOne({ id })
            await menuPermissionsModel.deleteMany({ routeId: id })
            return deleteResult
        })
        if (result.affectedRows > 0) {
            ctx.success(null, "删除成功")
        } else {
            ctx.fail("删除失败数据不存在")
        }
    },
}