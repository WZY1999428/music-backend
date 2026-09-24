
import { roleModel, rolePermissionModel } from "@/database/model/system/role.js"
import { userRoleModel } from "@/database/model/user/index.js"

export default {
    action: '删除角色',
    logType: 'DELETE_ROLE',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;

        if (await userRoleModel.count({ query: { roleId: id } }) > 1) {
            return ctx.fail("删除失败该角色下存在多个用户")
        }

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