const userModel = require("@/database/model/user")
const AppError = require("@/utils/error")
module.exports = {
    /** @type {Controller} */
    handler: async (ctx) => {
        const { username, password, code } = ctx.request.body;
        $validate(username, "账号不能为空");
        $validate(password, "密码不能为空");
        $validate(code, "验证码不能为空");
        ctx.valkey.assertLoginAttemptLimit(username)
        const user = userModel.findOne({ username })
        if (!user) throw new AppError("账号不存在")
        if (password != user.password) throw new AppError("密码错误");
        ctx.valkey.resettLoginAttemptLimit(username)
        ctx.success("1231132123", "登录成功")
    },
    auth: false
}