import userModel , { userRoleModel, userDeptModel } from "@/database/model/system/user.js"

export default {
    action: '获取系统用户详情',
    logType: 'GET_SYSTEM_USER_DETAIL',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        $validate(id, '用户ID不能为空');
        const { password, ...user } = await userModel.findOne({ id });
        const roles = await userRoleModel.findMany({ userId: id });
        const depts = await userDeptModel.findMany({ userId: id });
        ctx.success({ ...user, roleIds: roles.map(r => r.roleId), deptIds: depts.map(d => d.deptId) });
    },
}