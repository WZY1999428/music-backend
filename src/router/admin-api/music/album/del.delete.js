import { albumModel } from "@/database/model/music/album.js";
export default {
    action: '删除专辑',
    logType: 'DELETE_MUSIC_ALBUM',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "id不能为空")
        const result = await albumModel.deleteOne({ id })
        if (result.affectedRows === 0) {
            ctx.fail("专辑不存在");
            return;
        }
        ctx.success(null, "删除成功");
    },
}