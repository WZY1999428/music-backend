import artistModel from "@/database/model/music/artist.js";

export default {
    action: '获取歌手选项',
    logType: 'GET_MUSIC_ARTIST_OPTIONS',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { keyword, value } = ctx.request.query;
        const query = {}
        if (keyword && keyword.trim()) query.name = { $like: `%${keyword.trim()}%` }
        if (value) query.id = value;
        const list = await artistModel.findMany(query, {
            fields: ["id", "name"],
            ...paginate(1, 20)
        })
        ctx.success({
            list: list.map(item => ({
                value: item.id,
                label: item.name
            }))
        });
    }
}