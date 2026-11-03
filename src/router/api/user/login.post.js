
import appUserModel from "@/database/model/app/user/user.js"
import { generateAppToken } from "@/utils/token.js";
import { hashPassword, verifyPassword } from "@/utils/password.js";
import { validateEmail}from "@/utils/validate.js";


export default {
    action: 'app用户登录',
    logType: 'APP_USER_LOGIN',
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {

        const { username, password } = ctx.request.body;

        $validate(username, '用户名不能为空');
        $validate(password, '密码不能为空');
    
        let userinfo = await appUserModel.findOne({ username });

        if (!userinfo) {
            const obj = {
                username,
                nickname: username,
                password: await hashPassword(password),
            };

            if (validateEmail(username)) {
                obj.email = username;
            }

            await appUserModel.insertOne(obj);

            userinfo = await appUserModel.findOne({ username });

        } else if (!(await verifyPassword(password, userinfo.password))) {
            ctx.success("登录失败，密码不正确");
            return;
        }

        ctx.success(await generateAppToken({
            userId: userinfo.id,
            username: userinfo.username,
            nickname: userinfo.nickname,
            email: userinfo.email,
            gender: userinfo.gender,
            phone: userinfo.phone
        }), "登录成功");
    },
}
