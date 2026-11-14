import { userPlaylistSongModel, userPlaylistModel } from "@/database/model/app/user/userPlaylist.js"
import { songModel } from "@/database/model/music/song.js";
import { getSongList } from "@/utils/getSongList.js";
export default {
    action: '获取用户歌单歌曲',
    logType: 'GET_USER_PLAYLIST_SONG',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { playlistId } = ctx.request.query;
        $validate(playlistId, "歌单id不能为空");

        const userId = ctx.appUser.userId;
        const playlist = await userPlaylistModel.findOne({ userId: userId, id: playlistId }, { fields: ["id"] })
        if (!playlist) {
            ctx.fail("歌单不存在");
            return;
        }

        const songList = await getSongList({}, {
            userId,
            joins: [
                {
                    table: userPlaylistSongModel.table,
                    as: "userPlaylist",
                    on: { "userPlaylist.playlistId": { $eq: playlistId }, "userPlaylist.songId": songModel.qualifyField("id") }
                }
            ]
        })

        ctx.success(songList);
    },
}