const { User } = require('@/modules/sqlite/model')
const { createToken } = require('@/modules/tokens');
module.exports = {
    get: async (ctx) => {
        if (await User.findOne([])) return ctx.fail("账号只能初始化一次")
        const { username, password } = ctx.request.body;
        if (!username) return ctx.fail("用户名不能为空")
        if (!password) return ctx.fail("密码不能为空")
        const user = await User.insert({ username, password })
        ctx.success(await createToken(user.id), "注册成功")
    },
    authRequired: false
}
