import artistModel from "@/database/model/music/artist.js";
import uploadModel from "@/database/model/upload.js";
import { formatUploadFileRef } from "@/utils/parse.js";
export default {
    action: '获取歌手详情',
    enableLog: false,
    logType: 'GET_MUSIC_ARTIST_DETAIL',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        const artis = await artistModel.findOne({ id })
        if (!artis) return ctx.fail("歌手不存在")
        const ids = [artis.avatar, artis.cover].filter(Boolean)
        const files = await uploadModel.findMany({ id: { $in: ids } })
        artis.cover = formatUploadFileRef(files, artis.cover)
        artis.avatar = formatUploadFileRef(files, artis.avatar)
        ctx.success(artis)
    },
}

