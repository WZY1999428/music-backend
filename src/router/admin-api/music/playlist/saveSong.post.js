import { playlistSongModel, playlistModel } from "@/database/model/music/playlist.js";

export default {
    action: '保存歌单歌曲',
    logType: 'SAVE_PLAYLIST_SONG',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { playlistId, songIds } = ctx.request.body;
        $validate(playlistId, "歌单id不能为空")
        if (!songIds || !songIds.length) {
            return ctx.fail("歌曲id不能为空")
        }

        const playlist = await playlistModel.findOne({ id: playlistId })
        if (!playlist) return ctx.fail("歌单不存在")

        // 插入新的关联
        const playlistSongs = songIds.map(songId => ({ playlistId, songId }))
        await playlistSongModel.insertMany(playlistSongs, { ignore: true })

        ctx.success("添加成功");
    },
}