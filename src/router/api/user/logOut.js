export default {
     action: 'app用户登出',
     logType: 'APP_USER_LOGOUT',
     /** @type {Controller} */
     handler: async (ctx) => {
         ctx.success();
     },
}