import userModel, { userRoleModel, userDeptModel } from "@/database/model/system/user.js"

export default {
    action: '删除系统用户',
    logType: 'DELETE_SYSTEM_USER',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        if (id == ctx.user.userId) {
            return ctx.fail("不能删除自己")
        }
        const result = await userModel.withTransaction(async model => {
            await userRoleModel.deleteMany({ userId: id })
            await userDeptModel.deleteMany({ userId: id })
            return await model.deleteOne({ id })
        })
        if (result.affectedRows == 0) {
            return ctx.fail("删除失败用户不存在")
        }
        ctx.success("删除成功")
    },
}
