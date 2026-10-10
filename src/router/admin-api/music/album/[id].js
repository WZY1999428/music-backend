import uploadModel from "@/database/model/upload.js";
import { albumModel, albumArtistModel, albumSongModel } from "@/database/model/music/album.js";
import { formatUploadFileRef, parseJsonToArray } from "@/utils/parse.js";
export default {
    action: '获取专辑详情',
    enableLog: false,
    logType: 'GET_MUSIC_ALBUM_DETAIL',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        const song = await albumModel.findOne({ id })
        if (!song) return ctx.fail("歌曲不存在")
        const ids = [song.cover].filter(Boolean)
        const [files, artis] = await Promise.all([
            uploadModel.findMany({ id: { $in: ids } }),
            albumArtistModel.findMany({ albumId: id }, { fields: ["artistId"] }),
        ])
        song.cover = formatUploadFileRef(files, song.cover)
        song.genre = parseJsonToArray(song.genre)
        song.singerList = artis.map(item => item.artistId)
        ctx.success(song)
    },
}

