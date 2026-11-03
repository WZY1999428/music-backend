import { getSongList } from "@/utils/getSongList.js";
import { paginate } from "@/utils/paginate.js";

export default {
    action: 'APP获取根据名称获取歌手歌曲',
    logType: 'APP_GET_ARTIST_NAME_BY_SONG',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { name, pageIndex, pageSize } = ctx.request.query;
        const result = await getSongList({
            "artist.name": name
        },
            { ...paginate(pageIndex, pageSize) }
        )
        if (result) {
            ctx.success(result)
        } else {
            ctx.fail('歌手不存在')
        }
    },
}