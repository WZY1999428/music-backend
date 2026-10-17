import { playlistModel } from "@/database/model/music/playlist.js";

export default {
    action: '获取歌单选项',
    logType: 'GET_MUSIC_PLAYLIST_OPTIONS',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { keyword, value } = ctx.request.query;
        const query = {}
        if (keyword && keyword.trim()) query.title = { $like: `%${keyword.trim()}%` }
        if (value) query.id = value;
        const list = await playlistModel.findMany(query, {
            fields: ["id", "title"],
            ...paginate(1, 20)
        })
        ctx.success({
            list: list.map(item => ({
                value: item.id,
                label: item.title
            }))
        });
    }
}