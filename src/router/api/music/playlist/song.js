import { playlistModel, playlistSongModel } from "@/database/model/music/playlist.js"
import { songModel } from "@/database/model/music/song.js"
import { getSongList } from "@/utils/getSongList.js";

export default {
    action: '获取歌单音乐',
    logType: 'APP_GET_PLAYLIST_SONG',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { playlistId } = ctx.request.query;
        if (!playlistId) {
            ctx.error('歌单ID不能为空');
            return;
        }
        $validate(await playlistModel.findOne({ id: playlistId }), "歌单不存在");
        const songs = await playlistSongModel.findMany({ playlistId });
        if (!songs.length) return ctx.success([]);
        const songList = await getSongList({ [songModel.qualifyField("id")]: { $in: songs.map(song => song.songId) } })
        ctx.success(songList);
    },
}