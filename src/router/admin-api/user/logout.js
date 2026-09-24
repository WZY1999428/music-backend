export default {
    action: '用户退出',
    logType: 'USER_LOGOUT',
    /** @type {Controller} */
    handler: async (ctx) => {
        await valkey.delToken(ctx.token);
        ctx.success(null, "退出成功")
    },
}