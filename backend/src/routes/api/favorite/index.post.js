const { Favorite } = require("@/modules/mongo/model");
module.exports = async (ctx) => {
    try {
        const { ids } = ctx.request.body;
        if (!ids || !ids.length) return ctx.fail("文件id不能为空");
        await Favorite.insertMany({ $and: [{ fileId: { $in: ids } }, { userId: ctx.state.user.userId }] });
        ctx.success("收藏成功");
    } catch (error) {
        ctx.fail(error.message);
    }
}
