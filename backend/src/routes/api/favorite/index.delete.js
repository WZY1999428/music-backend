const { Favorite } = require("@/modules/mongo/model");
module.exports = async (ctx) => {
    try {
        const { ids } = ctx.request.body;
        if (!ids || !ids.length) return ctx.fail("缺少收藏id不能为空");
        await Favorite.deleteMany({ $and: [{ id: { $in: ids } }, { userId: ctx.state.user.userId }] });
        return ctx.success("取消收藏成功");
    } catch (error) {
        return ctx.fail(error.message);
    }
}