import deptModel from "@/database/model/system/dept.js"
import { userDeptModel } from "@/database/model/system/user.js"
export default {
    action: '删除部门信息',
    logType: 'DELETE_DEPT_INFO',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "id不能为空")

        if (await userDeptModel.findOne({ deptId: id })) {
            return ctx.fail("该部门下存在用户，无法删除")
        }

        if (await deptModel.findOne({ parentId: id })) {
            return ctx.fail("该部门下存在子部门，无法删除")
        }


        const result = await deptModel.withTransaction(async model => {
            await userDeptModel.deleteMany({ deptId: id })
            return await model.deleteOne({ id })
        })
        if (result.affectedRows > 0) {
            ctx.success(null, "删除成功")
        } else {
            ctx.fail("删除失败,数据不存在")
        }
    },
}