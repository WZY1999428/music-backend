import { userPlaylistModel, userPlaylistSongModel } from "@/database/model/app/user/userPlaylist.js"
import { songModel } from "@/database/model/music/song.js"
export default {
    action: '获取用户歌单',
    logType: 'GET_USER_PLAYLIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const userId = ctx.appUser.userId;

        const fields = userPlaylistModel.qualifyFields(["id", "title", "description"])

        const playlist = await userPlaylistModel.aggregate({
            fields: fields,
            query: { [userPlaylistModel.qualifyField("userId")]: userId },
            joins: [{
                table: userPlaylistSongModel.table,
                as: "userPlaylistSong",
                type: "left",
                on: { "userPlaylistSong.playlistId": userPlaylistModel.qualifyField("id") },
                select: [
                    {
                        type: "jsonArray",
                        alias: "songList",
                        fields: { playlistId: "userPlaylistSong.playlistId", songId: "userPlaylistSong.songId" }
                    }
                ]
            }],
            group: [userPlaylistModel.qualifyField("id")]
        })

        const ids = new Set()
        playlist.forEach(pl => pl.songList.slice(0, 8).forEach(song => { ids.add(song.songId) }))
        if (ids.size > 0) {
            const songList = await getSongList({
                [songModel.qualifyField("id")]: { $in: Array.from(ids) }
            })
            const songMap = new Map(songList.map(song => [song.id, song]))
            playlist.forEach(pl => pl.songList = pl.songList.map(song => songMap.get(song.songId)).filter(Boolean))
        }

        ctx.success(playlist);
    },
}