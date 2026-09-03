import userModel from "@/database/model/user/index.js";
/** @type {Controller} */
export default async (ctx) => {
    const user = ctx.user;
    const userInfo = await userModel.findOne({ id: user.id })
    if (!userInfo) return ctx.fail("用户不存在")
    const { password, ...data } = userInfo;
    ctx.success(data, "获取用户信息成功");
}