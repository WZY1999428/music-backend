const { Favorite } = require("@/modules/sqlite/model");
module.exports = async (ctx) => {
    const { favoriteIds } = ctx.request.body;
    if (!favoriteIds || !favoriteIds.length) return ctx.fail("缺少收藏id不能为空");
    
    await Favorite.delete({ id: favoriteId });
    return ctx.success("取消收藏成功");
}