
import { userRoleModel } from "@/database/model/user/index.js"
export default {
    action: '获取角色成员',
    logType: 'GET_ROLE_USERS',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "角色id不能为空")
        const users = await userRoleModel.findMany({ roleId: id }, { fields: ['userId'] })
        ctx.success(users.map((user) => user.userId));
    },
}