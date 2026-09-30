import { playlistModel } from "@/database/model/music/playlist.js";
export default {
    action: '删除歌单',
    logType: 'DELETE_MUSIC_PLAYLIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "id不能为空")
        const result = await playlistModel.deleteOne({ id })
        if (result.affectedRows === 0) {
            ctx.fail("删除失败，歌单不存在");
            return;
        }
        ctx.success(null, "删除成功");
    },
}