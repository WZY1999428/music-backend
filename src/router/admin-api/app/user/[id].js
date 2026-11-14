import userModel from "@/database/model/app/user/user.js"
import userPlayHistoryModel from "@/database/model/app/user/userPlayHistory.js"
import { userPlaylistModel } from "@/database/model/app/user/userPlaylist.js"
import { songModel } from "@/database/model/music/song.js"
export default {
    action: '获取用户详情',
    logType: 'GET_APP_USER_DETAIL',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        $validate(id, "用户ID不能为空");
        const user = await userModel.findOne({ id })
        if (!user) {
            return ctx.fail("用户不存在");
        }
        //  (song: 歌曲, album: 专辑, artist: 歌手, playlist: 歌单)
        const [playHistoryList, playlistList] = await Promise.all([
            findUserPlayHistory(id),  // 播放历史
            findUserPlaylist(id)  // 播放列表
        ]);


        const { password, ...userWithoutPassword } = user;
        ctx.success({
            ...userWithoutPassword,
            playHistoryList,
            playlistList
        });
    }
}




function findUserPlayHistory(userId) {
    const fields = songModel.qualifyFields(['id', 'title', 'mvUrl', 'cover', 'createUserId', 'enabled', 'publishDate'])
    const songId = songModel.qualifyField("id");
    return userPlayHistoryModel.aggregate({
        query: { [userPlayHistoryModel.qualifyField("userId")]: userId },
        fields,
        joins: [{
            table: songModel.table,
            type: "left",
            as: songModel.table,
            on: { [songId]: userPlayHistoryModel.qualifyField("songId") },
        }],
    })
}

function findUserPlaylist(userId) {
    const fields = userPlaylistModel.qualifyFields()
    return userPlaylistModel.aggregate({
        query: { [userPlaylistModel.qualifyField("userId")]: userId },
        fields,
    })
}

