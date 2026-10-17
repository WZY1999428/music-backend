import userModel from "@/database/model/app/user/user.js"

export default {
    action: 'app用户注册/编辑',
    logType: 'APP_USER_REGISTER',
    /** @type {Controller} */
    handler: async (ctx) => {
        let { id: userId, username, password, nickname, avatar, email, phone, gender, birthday, signature, enabled = 1 } = ctx.request.body;

        $validate(username, "账号不能为空");
        $validate(nickname, "昵称不能为空");
        $validate(phone, "手机号不能为空");
        if (!avatar || !avatar.id) {
            return ctx.fail("头像不能为空");
        }

        if (username.length < 10 || username.length > 15) {
            return ctx.fail("账号长度不能小于10位并且不能大于15位");
        }

        if (!userId && !password) {
            password = "12345678";
        }

        if (password && (password.length < 8 || password.length > 16)) {
            return ctx.fail("密码长度不能小于8位并且不能大于16位");
        }


        const user = await userModel.findOne({ username });

        if (user && user.id !== userId) {
            return ctx.fail("该账号已被使用请重新输入");
        }

        const params = { username, nickname, avatar: avatar.id, email, phone, gender, birthday, signature, enabled };
        if (password) params.password = password;
        userId ? await userModel.updateOne({ id: userId }, params) : await userModel.insertOne(params);
        ctx.success(null, userId ? "更新成功" : "添加成功")
    }
}
