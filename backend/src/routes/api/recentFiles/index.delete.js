const { RecentFiles } = require("@/modules/mongo/model");
module.exports = async (ctx) => {
    try {
        const { ids, clear } = ctx.request.body;
        if ((!ids || !ids.length) && !clear) return ctx.fail("缺少收藏id不能为空");
        if (clear) {
            await RecentFiles.clear();
            return ctx.success("最近访问清空成功");
        } else {
            await RecentFiles.deleteMany({ $and: [{ id: { $in: ids } }, { userId: ctx.state.user.userId }] });
            return ctx.success("删除记录成功");
        }
    } catch (error) {
        return ctx.fail(error.message);
    }
}