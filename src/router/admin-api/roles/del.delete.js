
import { roleModel, roleMenuModel, menuPermissionsModel } from "@/database/model/permission/role.js"

/** @type {Controller} */
export default async (ctx) => {
    const { id } = ctx.request.query;
    const result = await roleModel.withTransaction(async model => {
        await roleMenuModel.deleteOne({ routeId: id })
        await menuPermissionsModel.deleteOne({ routeId: id })
        return await model.deleteOne({ id })
    })
    console.log(result);
    ctx.success(id)
}