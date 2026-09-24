import userModel, { userRoleModel } from "@/database/model/user/index.js";
export default {
    action: '获取用户信息',
    logType: 'GET_USER_INFO',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const user = ctx.user;
        const userInfo = await userModel.findOne({ id: user.userId })
        if (!userInfo) return ctx.fail("用户不存在")
        const { password, ...data } = userInfo;
        if (ctx.user.roleId) {
            const roles = await userRoleModel.aggregate({
                query: { userId: ctx.user.userId, roleId: ctx.user.roleId },
                fields: [
                    "user_role.roleId",
                    "roles.name",
                ],
                joins: [{
                    table: "roles",
                    type: "left",
                    as: "roles",
                    on: { "roles.id": "user_role.roleId" },
                }],
                group: ["user_role.roleId"],
                sort: { "roles.id": "asc" },
                limit: 1,
            });
            data.role = roles[0] || null;
        }

        ctx.success(data, "获取用户信息成功");
    },
}