import appUserModel from "@/database/model/app/user/user.js";
export default {
    action: '更新用户信息',
    logType: 'UPDATE_USER_INFO',
    /** @type {Controller} */
    handler: async (ctx) => {
        //       val id: Long, username: String, nickname: String, avatar: String? = null, email: String? = null, phone: String? = null, gender: Int = 1, birthday: String? = null, signature: String? = null,
        const { id, nickname, avatar, email, phone, gender, birthday, signature } = ctx.request.body;

        $validate(nickname, "昵称不能为空")
        $validateEmail(email, "邮箱格式不正确")
        if (!avatar) {
            return ctx.fail("头像不能为空")
        }
        await appUserModel.updateOne({ id }, { nickname, avatar, email, phone, gender, birthday, signature })
        ctx.success();
    },
}