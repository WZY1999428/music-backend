import { playlistModel, playlistSongModel } from "@/database/model/music/playlist.js";

export default {
    action: '删除歌单歌曲',
    logType: 'DELETE_PLAYLIST_SONG',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { playlistId, songIds } = ctx.request.query;

        $validate(playlistId, "歌单id不能为空")
        if (!songIds || !songIds.length) {
            return ctx.fail("歌曲id不能为空")
        }

        const playlist = await playlistModel.findOne({ id: playlistId })
        if (!playlist) return ctx.fail("歌单不存在")
        await playlistSongModel.deleteMany({ playlistId, songId: { $in: songIds } })
        ctx.success("删除成功");
    },
}