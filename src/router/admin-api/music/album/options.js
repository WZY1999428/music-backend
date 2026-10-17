import { albumModel } from "@/database/model/music/album.js";
import { paginate } from "@/utils/paginate";
import { parseJsonToArray } from "@/utils/parse.js";
export default {
    action: '获取专辑选项',
    logType: 'GET_MUSIC_ALBUM_OPTIONS',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { keyword, value } = ctx.request.query;
        const query = {}
        if (keyword && keyword.trim()) query.title = { $like: `%${keyword.trim()}%` }
        if (value) query.id = value;
        const list = await albumModel.findMany({ query }, { ...paginate(1, 20) })
        ctx.success({
            list: list.map(item => ({
                label: item.title,
                value: item.id
            }))
        });
    },
}