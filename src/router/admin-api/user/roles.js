import { userRoleModel } from "@/database/model/user/index.js"
// import { roleModel } from "@/database/model/system/role.js"

export default {
    action: '获取用户角色',
    logType: 'GET_USER_ROLES',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const roles = await userRoleModel.aggregate({
            query: { userId: ctx.user.userId },
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
        })
        ctx.success(roles);
    },
}