// 获取用户是否注册

const { User } = require('@/modules/sqlite/model')
module.exports = {
    get: async (ctx) => ctx.success(await User.findOne([]) != null),
    authRequired: false
}