import userModel from "@/database/model/app/user/user.js"
import uploadModel from "@/database/model/upload.js"

export default {
    action: '获取用户信息',
    logType: 'GET_APP_USER_INFO',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "用户ID不能为空");


        const user = await userModel.findOne({ id })
        if (!user) {
            return ctx.fail("用户不存在");
        }

        if (user.avatar) {
            const upload = await uploadModel.findOne({ id: user.avatar })
            if (upload) {
                user.avatar = {
                    id: upload.id,
                    url: upload.url,
                };
            }
        }

        const { password, ...userWithoutPassword } = user;
        ctx.success(userWithoutPassword);
    }
}
