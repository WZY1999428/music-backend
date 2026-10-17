
import { songModel } from "@/database/model/music/song"
import artistModel from "@/database/model/music/artist"

export default {
    action: 'app获取歌曲关键词',
    logType: 'APP_GET_SONG_KEYWORD',
    enableLog: true,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { keyword } = ctx.request.query
        if (!keyword || keyword.trim() === "") return ctx.success([]);
        
        const maxLimit = 10;
        const artists = await artistModel.findMany({
            "name": { $like: `%${keyword}%` }
        }, { fields: ["name"], limit: 5 });
        const songs = await songModel.findMany({
            "title": { $like: `%${keyword}%` }
        }, { fields: ["title"], limit: maxLimit - artists.length });

        const list = [
            ...artists.map(i => i.name),
            ...songs.map(i => i.title),
        ];

        ctx.success(list);
    },
}
