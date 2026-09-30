import uploadModel from "@/database/model/upload.js";
import { playlistModel } from "@/database/model/music/playlist.js";
import { formatUploadFileRef } from "@/utils/parse.js";
export default {
    action: '获取歌单详情',
    enableLog: false,
    logType: 'GET_MUSIC_PLAYLIST_DETAIL',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        const song = await playlistModel.findOne({ id })
        if (!song) return ctx.fail("歌单不存在")
        if (song.cover) {
            const files = await uploadModel.findOne({ id: song.cover });
            song.cover = formatUploadFileRef([files], song.cover)
        }
        ctx.success(song)
    }
}

