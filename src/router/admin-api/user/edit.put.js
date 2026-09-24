import userModel from "@/database/model/user/index.js"

export default {
    action: '修改用户基本信息',
    logType: 'EDIT_USER_INFO',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { avatar, nickname, phone, email } = ctx.request.body;
        $validate(nickname, "昵称不能为空")
        $validatePhone(phone, "手机号格式不正确")
        if (email) {
            $validateEmail(email, "邮箱格式不正确")
        }

        await userModel.updateOne({ id: ctx.user.userId }, { nickname, phone, email, avatar })
        ctx.success(null, "更新成功");
    },
}