import bannerModel from "@/database/model/app/banner.js";

export default {
    action: '保存轮播图',
    logType: 'SAVE_APP_BANNER',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id, image, type, title, value, enabled, desc, sort = 1 } = ctx.request.body;
        $validate(title, "轮播图标题不能为空")
        $validate(type, "轮播图类型不能为空")
        $validate(value, "轮播图值不能为空")    
        if (!image || !image.id) {
            return ctx.fail("轮播图封面不能为空")
        }
        const params = { image: image.id, type, title, value, enabled, desc, sort , createUserId: ctx.user.userId };
        id ? await bannerModel.updateOne({ id }, params) : await bannerModel.insertOne(params)
        ctx.success(null, id ? "更新成功" : "添加成功")
    },
}


