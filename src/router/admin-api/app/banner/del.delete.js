import bannerModel from "@/database/model/app/banner.js";

export default {
    action: '删除轮播图',
    logType: 'DELETE_APP_BANNER',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "id不能为空")
        const result = await bannerModel.deleteOne({ id })
        if (result.affectedRows === 0) {
            ctx.fail("删除失败，轮播图不存在");
            return;
        }
        ctx.success(null, "删除成功");
    },
}