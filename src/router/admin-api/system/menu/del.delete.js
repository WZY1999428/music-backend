import routeModel, { menuPermissionsModel } from "@/database/model/system/menu.js";
/** @type {Controller} */
export default async (ctx) => {
    const id = ctx.request.query.id;
    $validate(id, "菜单ID不能为空");
    const result = await routeModel.withTransaction(async (model) => {
        const deleteResult = await model.deleteOne({ id })
        await menuPermissionsModel.deleteMany({ menuId: id })
        return deleteResult
    })
    if (result.affectedRows > 0) {
        ctx.success(null, "删除成功")
    } else {
        ctx.fail("删除失败数据不存在")
    }
}