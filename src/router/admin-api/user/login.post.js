import userModel from "@/database/model/user/index.js"
import generateToken from "@/utils/token.js"
export default {
    action: '用户登录',
    logType: 'USER_LOGIN',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { username, password, code } = ctx.request.body;
        $validate(username, "账号不能为空");
        $validate(password, "密码不能为空");
        $validate(code, "验证码不能为空");
        await valkey.assertLoginAttemptLimit(username) 
        const user = await userModel.findOne({ username })
        if (!user) return ctx.fail("账号不存在，请重新输入")
        $validateEq(password, user?.password, "密码错误");
        await valkey.resettLoginAttemptLimit(username)
        ctx.success(await generateToken({ username, id: user.id, role: user.role }), "登录成功")
    },
    auth: false
}   

