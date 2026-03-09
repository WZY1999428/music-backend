const { User } = require('@/modules/sqlite/model')
const { createToken } = require('@/modules/tokens')
module.exports = {
    get: async (ctx) => {
        try {
            const { username, password } = ctx.request.body
            if (!username) return ctx.fail("用户名不能为空")
            if (!password) return ctx.fail("密码不能为空")
            if (!await User.findOne([])) throw new Error("账号未初始化")
            const info = await User.findOne([{ field: "username", value: username }, { field: "password", value: password }])
            if (!info) throw new Error("用户名或密码错误")
            ctx.success(await createToken(info.id), "登录成功")
        } catch (error) {
            ctx.fail(error.message)
        }
    },
    authRequired: false
}