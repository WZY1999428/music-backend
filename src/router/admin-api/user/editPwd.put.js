import userModel from "@/database/model/user/index.js"
export default {
    action: '修改用户密码',
    logType: 'EDIT_PASSWORD',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { oldPassword, password } = ctx.request.body;
         
        $validate(oldPassword, "旧密码不能为空");
        $validate(password, "新密码不能为空");

        if (password && (password.length < 8 || password.length > 16)) {
            return ctx.fail("密码长度不能小于8位并且不能大于16位");
        }

        const userinfo = userModel.findOne({ id: ctx.user.userId });

        if (userinfo.password != oldPassword) {
            return ctx.fail("旧密码不正确")
        }

        // 更新密码
        await userModel.updateOne({ id: ctx.user.userId }, { password });
        ctx.success(null, "修改成功");
    },
}