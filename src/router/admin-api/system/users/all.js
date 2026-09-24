import userModel from "@/database/model/user/index.js"

export default {
    action: '获取全部成员',
    logType: 'GET_ALL_USERS',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const users = await userModel.findMany(NORMAL_ENABLED_USER_QUERY, {
            fields: ['id', 'username', 'nickname', 'email', 'phone']
        });
        ctx.success({
            list: users,
            total: users.length
        });
    },
}