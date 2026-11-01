import { playlistModel, playlistSongModel, playlistStatsModel, favoritePlaylistModel, playlistTagModel } from "@/database/model/music/playlist.js";
export default {
    action: '删除歌单',
    logType: 'DELETE_MUSIC_PLAYLIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "id不能为空")
        const result = await playlistModel.withTransaction(async (model) => {
            await playlistSongModel.deleteMany({ playlistId: id })
            await playlistStatsModel.deleteMany({ playlistId: id })
            await favoritePlaylistModel.deleteMany({ playlistId: id })
            await playlistTagModel.deleteMany({ playlistId: id })
            return await model.deleteOne({ id })
        })
        if (result.affectedRows === 0) {
            ctx.fail("删除失败，歌单不存在");
            return;
        }
        ctx.success(null, "删除成功");
    },
}