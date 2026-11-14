import userPlayHistoryModel from "@/database/model/app/user/userPlayHistory.js"
import { songModel, songArtistModel } from "@/database/model/music/song.js";
import artistModel from "@/database/model/music/artist.js";
import uploadModel from "@/database/model/upload.js";
export default {
    action: '获取播放记录',
    logType: 'GET_PLAY_HISTORY',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { userId, pageIndex, pageSize } = ctx.request.query;
        const fields = songModel.qualifyFields()
        const countField = userPlayHistoryModel.qualifyField("playCount");
        const lastPlayedAt = userPlayHistoryModel.qualifyField("lastPlayedAt")
        fields.push(countField)
        fields.push(lastPlayedAt)
        const songIdField = songModel.qualifyField("id")
        const [list, total] = await Promise.all([
            userPlayHistoryModel.aggregate({
                query: { [userPlayHistoryModel.qualifyField("userId")]: userId },
                fields,
                joins: [{
                    table: songModel.table,
                    type: "left",
                    on: { [songIdField]: userPlayHistoryModel.qualifyField("songId") },
                }, {
                    table: uploadModel.table,
                    as: "upload",
                    type: "left",
                    on: { "upload.id": songModel.qualifyField("cover") },
                    select: [{ type: "raw", fields: { "cover": "upload.url" } }]
                }, {
                    table: songArtistModel.table,
                    as: "songArtist",
                    on: {
                        "songArtist.songId": songIdField
                    }
                },
                {
                    table: artistModel.table,
                    as: "artist",
                    on: {
                        "artist.id": "songArtist.artistId"
                    },
                    select: [
                        {
                            type: "jsonArray",
                            alias: "artists",
                            fields: {
                                artistId: "artist.id",
                                artistName: "artist.name"
                            }
                        }
                    ]
                }],
                sort:{
                  [lastPlayedAt]: 'desc'
                },
                group: [songIdField, countField, lastPlayedAt],
                ...paginate(pageIndex, pageSize)
            }),
            userPlayHistoryModel.count({ query: { userId: userId } })
        ])
        ctx.success({ list, total });
    },
}