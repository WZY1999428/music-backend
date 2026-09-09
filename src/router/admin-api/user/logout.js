export default {
    action: '用户退出',
    logType: 'USER_LOGOUT',
    /** @type {Controller} */
    handler: async (ctx) => {
        const token = ctx.headers["authorization"];
        await valkey.delToken(token);
        ctx.success(null, "退出成功")
    },
}