const { RecentFiles } = require("@/modules/sqlite/model");
module.exports = async (ctx) => {
    try {
        const { ids, clear } = ctx.request.body;
        if ((!ids || !ids.length) && !clear) return ctx.fail("缺少收藏id不能为空");
        if (clear) {
            await RecentFiles.clear();
            return ctx.success("最近访问清空成功");
        } else {
            const datas = ids.map((id, index) => ({ field: "id", value: id, logic: index === ids.length - 1 ? "AND" : 'OR' }));
            datas.push({ field: "userId", value: ctx.state.user.userId });
            await RecentFiles.deleteMany(datas);
            return ctx.success("删除记录成功");
        }
    } catch (error) {
        return ctx.fail(error.message);
    }
}