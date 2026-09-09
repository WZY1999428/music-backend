import userModel from "@/database/model/user/index.js"
export default {
    action: '用户注册',
    logType: 'USER_REGISTER',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { username, password, email, nickname, avatar = "" } = ctx.request.body;
        $validate(username, "账号不能为空");
        $validate(password, "密码不能为空");
        $validateEmail(email, "邮箱格式不正确");
        $validate(nickname, "昵称不能为空");
        if (username.length < 10 || username.length > 15) return ctx.fail("账号长度不能小于10位并且不能大于15位");
        if (password.length < 8 || password.length > 16) return ctx.fail("密码长度不能小于8位并且不能大于16位");
        const user = await userModel.findOne({ username });
        if (user) return ctx.fail("该账号已被使用请重新输入");
        await userModel.insert({ username, password, email, nickname, rule: "", avatar })
        ctx.success(null, "注册成功")
    },
}
