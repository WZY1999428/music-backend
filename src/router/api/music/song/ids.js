import { getSongList } from "@/utils/getSongList.js";
import { songModel } from "@/database/model/music/song.js";


export default {
    action: '根据音乐ids获取音乐列表',
    logType: 'APP_GET_SONGS_BY_IDS',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { ids } = ctx.request.query;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return ctx.success([])
        }
        const songs = await getSongList({ [songModel.qualifyField("id")]: { $in: ids } }, { userId: ctx.appUser?.userId, })
        ctx.success(songs);
    },
}