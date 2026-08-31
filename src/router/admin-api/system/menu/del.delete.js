import routeModel, { menuButtonModel } from "@/database/model/system/menu.js";
/** @type {Controller} */
export default async (ctx) => {
    const id = ctx.request.query.id;
    $validate(id, "菜单ID不能为空");
    const result = await routeModel.withTransaction(async (model) => {
        const deleteResult = await model.delete({ id })
        await menuButtonModel.delete({ menuId: id })
        return deleteResult
    })
    ctx.success(null, "删除成功")
}