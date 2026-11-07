import { songModel } from "@/database/model/music/song.js"
export default {
    action: '热门新歌',
    logType: 'GET_HOT_NEW_SONGS',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const result = await getSongList({}, {
            userId: ctx.appUser?.userId,
            sort: Object.fromEntries(songModel.qualifyFields(["playTotal", "publishDate"]).map(field => [field, "desc"])),
            limit: 50
        })
        ctx.success(result);
    },
}
