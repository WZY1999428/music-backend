import userModel from "database/model/user/index.js"
import AppError from "utils/error.js"
import generateToken from "utils/token.js"
export default { 
    /** @type {Controller} */
    handler: async (ctx) => { 
        const { username, password, code } = ctx.request.body;
        $validate(username, "账号不能为空");
        $validate(password, "密码不能为空");
        $validate(code, "验证码不能为空");
        await ctx.valkey.assertLoginAttemptLimit(username)
        const user = await userModel.findOne({ username })
        if (!user) throw new AppError("账号不存在")
        if (password != user.password) throw new AppError("密码错误");
        await ctx.valkey.resettLoginAttemptLimit(username)
        ctx.success(generateToken({ username, id: user.id, role: user.role }), "登录成功")
    },
    auth: false
}  