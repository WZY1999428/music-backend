import appUserModel from "@/database/model/app/user/user.js";

export default {
    action: 'app获取用户信息',
    logType: 'APP_GET_USER_INFO',
    /** @type {Controller} */
    handler: async (ctx) => {
        const user = ctx.appUser;
        
        const userInfo = await appUserModel.findOne({ id: user.userId }, { fields: ["id", "username", "nickname", "avatar", "email", "phone", "gender", "birthday", "signature", "lastLoginAt", "lastLoginIp", "enabled"] });
        if (!userInfo) {
            ctx.fail('用户不存在');
            return;
        }
        if (userInfo.enabled != 1) {
            ctx.fail('用户已被禁用');
            return;
        }
        console.log(userInfo);
        
        ctx.success(userInfo);
    },
}