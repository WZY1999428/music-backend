const { User } = require('@/modules/sqlite/model')
const { createToken } = require('@/modules/tokens')

module.exports = async (ctx) => {
    const { username, password } = ctx.request.body
    if (!username) return ctx.fail("用户名不能为空")
    if (!password) return ctx.fail("密码不能为空")
    if (!await User.findOne()) return ctx.fail("账号未初始化");
    const info = await User.findOne({ username, password })
    if (!info) return ctx.fail("用户名或密码错误")
    ctx.success(await createToken(info.id), "登录成功")
}