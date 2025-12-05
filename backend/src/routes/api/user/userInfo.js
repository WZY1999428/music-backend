const { User } = require("@/modules/sqlite/model");
module.exports = async (ctx) => {
    const user_id = ctx.state.user.user_id;
    const uInfo = await User.findOne({ id: user_id });
    if (!uInfo) return ctx.fail("用户不存在");
    ctx.success({
        username: uInfo.username,
        id: uInfo.id,
        createdAt: uInfo.createdAt
    });
}