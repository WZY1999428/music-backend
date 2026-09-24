import artistModel from "@/database/model/music/artist.js";
export default {
    action: '删除歌曲',
    logType: 'DELETE_MUSIC_ARTIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "id不能为空")
        const result = await artistModel.deleteOne({ id })
        if (result.affectedRows === 0) {
            ctx.fail("歌手不存在");
            return;
        }
        ctx.success(null, "删除成功");
    },
}