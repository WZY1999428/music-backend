const { User } = require("@/modules/sqlite/model");
module.exports = async (ctx) => {
    const user_id = ctx.state.user.userId;
    const uInfo = await User.findOne([{ field: "id", value: user_id }]);
    if (!uInfo) return ctx.fail("用户不存在");
    ctx.success({
        username: uInfo.username,
        id: uInfo.id,
        createdAt: uInfo.createdAt
    });
}