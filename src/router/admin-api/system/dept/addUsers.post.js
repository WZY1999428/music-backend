import userModel, { userDeptModel } from "@/database/model/user/index.js"
import deptModel from "@/database/model/system/dept.js"

export default {
    action: '添加部门成员',
    logType: 'ADD_DEPT_USERS',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { deptId, userIds } = ctx.request.body;

        $validate(deptId, "部门id不能为空");

        $validate(await deptModel.findOne({ id: deptId }), "添加失败，部门不存在");

        if (!userIds.length) {
            return ctx.fail("请选择要添加的用户");
        }
        // 过滤真正有效用户
        const users = await userModel.findMany({ id: { $in: userIds } }, { fields: ["id"] })
        await userDeptModel.insertMany(users.map((u) => ({ deptId, userId: u.id })))
        ctx.success({ message: `成功添加 ${users.length} 个用户` });
    },
}