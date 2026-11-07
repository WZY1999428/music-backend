import { playlistModel, playlistStatsModel, playlistSongModel } from "@/database/model/music/playlist.js"
import uploadModel from "@/database/model/upload.js";
import { paginate } from "@/utils/paginate.js";

export default {
    action: 'app获取歌单列表',
    logType: 'APP_GET_PLAYLIST_LIST',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { pageIndex, pageSize } = ctx.request.query;
        const playlisFields = playlistModel.qualifyFields(["id", "isHot", "title", "description"]);
        const playlisStatsFields = playlistStatsModel.qualifyFields(["favoriteTotal", "playTotal", "clickTotal"]);

        const fields = [...playlisFields, ...playlisStatsFields]

        fields.push({
            songCount: {
                $count: {
                    table: playlistSongModel.table,
                    fields: ["id"],
                    query: {
                        playlistId: { $col: playlistIdField },
                    }
                }
            }
        })

        const result = await playlistModel.aggregate({
            fields,
            joins: [{
                table: playlistStatsModel.table,
                type: 'left',
                on: {
                    [playlistModel.qualifyField("id")]: playlistStatsModel.qualifyField("playlistId")
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
            ...paginate(pageIndex, pageSize)
        });
        ctx.success({
            list: result,
            total: await playlistModel.count({})
        });
    },
}