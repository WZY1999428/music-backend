import { userPlaylistSongModel, userPlaylistModel } from "@/database/model/app/user/playlist.js"

export default {
    action: '删除用户歌单',
    logType: 'DELETE_USER_PLAYLIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { playlistId } = ctx.request.query;
        $validate(playlistId, "歌单id不能为空");
        const userId = ctx.appUser.userId
        await userPlaylistModel.withTransaction(async (model) => {
            const result = model.deleteOne({ id: playlistId, createUserId: userId })
            if (result.affectedRows === 0) {
                throw new Error("歌单不存在");
            }
            // 删除歌单歌曲
            await userPlaylistSongModel.deleteMany({ playlistId: playlistId })
        })

        ctx.success("删除成功");
    },
}