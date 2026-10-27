import { playlistModel, playlistStatsModel } from "@/database/model/music/playlist.js"
import uploadModel from "@/database/model/upload.js";
export default {
    action: '获取歌单详情',
    logType: 'GET_PLAYLIST_INFO',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { playlistId } = ctx.request.query;
        $validate(playlistId, "歌单id不能为空")

        const playlisFields = playlistModel.qualifyFields(["id", "isHot", "title", "description"]);
        const playlisStatsFields = playlistStatsModel.qualifyFields(["favoriteTotal", "playTotal", "clickTotal"]);
        const pid = playlistModel.qualifyField("id");
        
        const result = await playlistModel.aggregate({
            query: {
                [pid]: playlistId
            },
            fields: [...playlisFields, ...playlisStatsFields],
            joins: [{
                table: playlistStatsModel.table,
                type: 'left',
                on: {
                    [pid]: playlistStatsModel.qualifyField("playlistId")
                }
            }, {
                table: uploadModel.table,
                type: 'left',
                on: {
                    [playlistModel.qualifyField("cover")]: uploadModel.qualifyField("id")
                },
                select: [
                    {
                        type: "raw",
                        fields: { cover: "upload.url" }
                    }
                ]
            }],
        });

        if (!result.length) {
            ctx.fail("歌单不存在");
            return;
        }
        
        ctx.success(result[0]);
    },
}