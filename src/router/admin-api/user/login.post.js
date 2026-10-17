import userModel, { userRoleModel } from "@/database/model/system/user.js"
import generateToken from "@/utils/token.js"
export default {
    action: '用户登录',
    logType: 'USER_LOGIN',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { username, password, captcha } = ctx.request.body;
        $validate(username, "账号不能为空");
        $validate(password, "密码不能为空");
        $validate(captcha, "验证码不能为空");

        const captchaValue = await valkey.getCaptcha(ctx.cookies.get("captcha_id"))
        const input = String(captcha ?? "").toLowerCase();
        const expected = String(captchaValue ?? "").toLowerCase();

        if (input !== expected) {
            return ctx.fail("验证码错误");
        }

        await valkey.assertLoginAttemptLimit(username)
        const user = await userModel.findOne({ username })
        if (!user) return ctx.fail("账号不存在，请重新输入")
        $validateEq(password, user?.password, "密码错误");
        await valkey.resettLoginAttemptLimit(username)
        const roles = await userRoleModel.findMany({ userId: user.id })
        const roleName = roles[0]?.name || null
        ctx.success(await generateToken({ username, nickname: user.nickname, userId: user.id, isSuperAdmin: user.isSuperAdmin === 1, roleId: roles[0]?.roleId, roleName }), "登录成功")
    },
    auth: false
}

