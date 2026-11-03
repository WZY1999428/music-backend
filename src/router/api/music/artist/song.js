import { getSongList } from "@/utils/getSongList.js";

export default {
    action: '获取歌手歌曲',
    logType: 'APP_GET_ARTIST_SONG',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { artistId } = ctx.request.query;
        $validate(artistId, "歌手id不能为空")
        const result = await getSongList({ "artist.id": artistId })
        console.log(result);
        ctx.success(result);
    },
}
