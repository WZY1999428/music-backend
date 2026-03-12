const { User } = require("@/modules/mongo/model");
module.exports = async (ctx) => {
    try {
        const uInfo = await User.findOne({ id: ctx.state.user.userId });
        if (!uInfo) throw new Error("用户不存在");
        ctx.success({
            username: uInfo.username,
            id: uInfo.id,
            createdAt: uInfo.createdAt
        });
    } catch (error) {
        ctx.fail(error.message);
    }
}