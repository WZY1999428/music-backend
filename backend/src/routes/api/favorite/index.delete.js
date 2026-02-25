const { Favorite } = require("@/modules/sqlite/model");
module.exports = async (ctx) => {
    try {
        const { ids } = ctx.request.body;
        if (!ids || !ids.length) return ctx.fail("缺少收藏id不能为空");
        const datas = ids.map((id, index) => ({ field: "id", value: id, logic: index === ids.length - 1 ? "AND" : 'OR' }));
        datas.push({ field: "userId", value: ctx.state.user.userId });
        await Favorite.deleteMany(datas);
        return ctx.success("取消收藏成功");
    } catch (error) {
        return ctx.fail(error.message);
    }
}