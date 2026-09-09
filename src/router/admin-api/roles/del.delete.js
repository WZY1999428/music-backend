
import { roleModel,  rolePermissionModel } from "@/database/model/permission/role.js"
export default {
    action: '删除角色',
    logType: 'DELETE_ROLE',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        const result = await roleModel.withTransaction(async model => {
            await rolePermissionModel.deleteMany({ roleId: id })
            return await model.deleteOne({ id })
        })
        if (result.affectedRows == 0) {
            return ctx.fail("删除失败角色不存在")
        }
        ctx.success("删除成功")
    },
}