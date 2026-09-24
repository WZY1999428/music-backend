import artistModel from "@/database/model/music/artist.js";
export default {
    action: '搜索歌手',
    logType: 'SEARCH_MUSIC_ARTIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { keyword } = ctx.request.query;
        const query = {};
        if (keyword) {
            query.$or = [
                {
                    name: { $like: `%${keyword}%` },
                },
                {
                    realName: { $like: `$${keyword}%` }
                }
            ]
        }
        const page = paginate(1, 20);
        const result = await artistModel.findMany(query, { ...page, fields: ["name", "id"] });
        ctx.success(result);
    },
}