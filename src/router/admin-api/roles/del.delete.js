
import { roleModel,  rolePermissionModel } from "@/database/model/permission/role.js"
/** @type {Controller} */
export default async (ctx) => {
    const { id } = ctx.request.query;
    const result = await roleModel.withTransaction(async model => {
        await rolePermissionModel.deleteMany({ roleId: id })
        return await model.deleteOne({ id })
    })
    if (result.affectedRows == 0) {
        return ctx.fail("删除失败角色不存在")
    }
    ctx.success("删除成功")
}