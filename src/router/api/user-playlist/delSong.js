import { userPlaylistSongModel, userPlaylistModel } from "@/database/model/app/user/userPlaylist.js"
export default {
    action: '从歌单删除歌曲',
    logType: 'DEL_SONG_FROM_PLAYLIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { playlistId, songId } = ctx.request.query;

        $validate(playlistId, "歌单id不能为空")

        const userId = ctx.appUser.userId;

        const exists = await userPlaylistModel.findOne({ id: playlistId, userId: userId })
        if (!exists) {
            ctx.fail('歌单不存在或无权限');
            return;
        }

        await userPlaylistSongModel.deleteOne({
            playlistId,
            songId,
        })

        ctx.success("删除成功");
    },
}