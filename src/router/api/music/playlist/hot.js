import { playlistModel, playlistStatsModel } from "@/database/model/music/playlist.js"


export default {
    action: '获取热门歌单',
    logType: 'APP_GET_PLAYLIST_HOT',
        auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const result = await playlistModel.aggregate({
            fields: playlistModel.qualifyFields(),
            joins: [{
                table: playlistStatsModel.table,
                as: 'stats',
                on: {
                    [playlistModel.qualifyField("id")]: 'stats.playlistId'
                }
            }],
            sort:{
                "stats.favoriteTotal": "desc",
                "stats.playTotal": "desc",
                "stats.clickTotal": "desc"
            },
            limit: 30
        });
        ctx.success(result);
    },
}