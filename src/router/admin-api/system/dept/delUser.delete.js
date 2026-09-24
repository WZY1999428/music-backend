import { userDeptModel } from "@/database/model/user/index.js"
export default {
    action: '删除部门成员',
    logType: 'DELETE_DEPT_INFO',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { userId, deptId } = ctx.request.query;
        $validate(userId, "成员Id不能为空")
        $validate(deptId, "部门Id不能为空")
        if (!await userDeptModel.findOne({ userId })) {
            return ctx.fail("部门不存在此用户删除失败")
        }

        const result = await userDeptModel.deleteMany({ userId, deptId })
        if (result.affectedRows > 0) {
            ctx.success(null, "删除成功")
        } else {
            ctx.fail("删除失败,数据不存在")
        }
    },
}