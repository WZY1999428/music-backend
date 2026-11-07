import { getSongList } from "@/utils/getSongList.js";
import { albumSongModel } from "@/database/model/music/album.js"

export default {
    action: '获取专辑歌曲',
    logType: 'APP_GET_ALBUM_SONG',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { albumId } = ctx.request.query;
        $validate(albumId, "专辑id不能为空")
        const result = await getSongList({ "albumSong.albumId": albumId }, {
            userId: ctx.appUser?.userId,
            joins: [{
                table: albumSongModel.table,
                as: 'albumSong',
                type: "left",
                on: {
                    "albumSong.songId": "music_song.id"
                }
            }]
        })

        ctx.success(result);
    },
}
