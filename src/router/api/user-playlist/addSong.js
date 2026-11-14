import { userPlaylistSongModel, userPlaylistModel } from "@/database/model/app/user/userPlaylist.js"

export default {
    action: '添加歌曲到歌单',
    logType: 'ADD_SONG_TO_PLAYLIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { playlistId, songId } = ctx.request.query;
        const userId = ctx.appUser.userId;
        const exists = await userPlaylistModel.findOne({ id: playlistId, userId: userId })
        if (!exists) {
            ctx.fail('歌单不存在或无权限');
            return;
        }
        await userPlaylistSongModel.insertOne({ playlistId, songId })
        ctx.success("添加成功");
    },
}