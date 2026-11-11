import artistModel from "@/database/model/music/artist.js";
export default {
    action: '搜索歌手',
    logType: 'SEARCH_MUSIC_ARTIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { ids } = ctx.request.query;
        if (!ids || !ids.length) {
            return ctx.success([])
        }
        const page = paginate(1, 20);
        const result = await artistModel.findMany({ id: { $in: ids } }, { ...page, fields: ["name", "id"] });
        ctx.success(result);
    },
}