import { songModel } from "@/database/model/music/song.js";

export default {
    action: '获取歌曲选项',
    logType: 'GET_MUSIC_SONG_OPTIONS',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { keyword, value } = ctx.request.query;
        const query = {
            $or: []
        }
        if (keyword && keyword.trim()) query.$or.push({ title: { $like: `%${keyword.trim()}%` } })
        if (value) query.$or.push({ id: value });

        const list = await songModel.findMany(query, {
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