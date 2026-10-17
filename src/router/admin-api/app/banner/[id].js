import bannerModel from "@/database/model/app/banner.js";
import uploadModel from "@/database/model/upload.js";
export default {
    action: '获取轮播图详情',
    logType: 'GET_APP_BANNER_DETAIL',
        enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        $validate(id, 'id不能为空');
        const banner = await bannerModel.findOne({ id });
        if (banner.image) {
            const img = await uploadModel.findOne({ id: banner.image });
            banner.image = {
                id: img.id,
                url: img.url
            }
        }
        ctx.success(banner);
    },
}