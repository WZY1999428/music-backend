const { Favorite } = require("@/modules/sqlite/model");
module.exports = async (ctx) => {
    try {
        const { fileIds } = ctx.request.body;
        if (!fileIds || !fileIds.length) return ctx.fail("文件id不能为空");
        const datas = fileIds.filter(id => id).map(id => ({ userId: ctx.state.user.userId, fileId: id }));
        await Favorite.insertMany(datas);
        ctx.success("收藏成功");
    } catch (error) {
        ctx.fail(error.message);
    }
}
