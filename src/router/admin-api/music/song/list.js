import { songModel, songArtistModel } from "@/database/model/music/song.js";
import artistModel from "@/database/model/music/artist.js";
import uploadModel from "@/database/model/upload.js";
export default {
    action: '获取歌曲列表',
    logType: 'GET_MUSIC_SONG_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { title, artist, dateRange = [], status, pageIndex, pageSize } = ctx.request.query;
        const query = {}
        if (title && title.trim()) query.title = { $like: `%${title.trim()}%` }
        const fields = songModel.qualifyFields();
        if (artist && artist.trim()) {
            query["$exists"] = {
                table: songArtistModel.table,
                joins: [
                    {
                        table: songArtistModel.table,
                        as: "songArtist",
                        type: "left",
                        on: { "songArtist.songId": songModel.qualifyField("id") }
                    },
                    {
                        table: artistModel.table,
                        as: "artistTable",
                        on: {
                            "artistTable.id": "songArtist.artistId"
                        }
                    }
                ],
                query: {
                    $or: [
                        { "artistTable.name": { $like: `%${artist.trim()}%` } },
                        { "artistTable.alias": { $like: `%${artist.trim()}%` } },
                    ]
                }
            };
        }

        if (parseInt(status) === 0 || parseInt(status) === 1) {
            query[songModel.qualifyField("enabled")] = status;
        }

        if (dateRange.length > 1) {
            const range = toDateTimeRange(dateRange)
            query[songModel.qualifyField("publishDate")] = { $between: range };
        }


        const [list, total] = await Promise.all([
            songModel.aggregate({
                fields,
                query,
                joins: [
                    {
                        table: "system_user",
                        as: "user",
                        type: "left",
                        on: {
                            "user.id": songModel.qualifyField("createUserId")
                        },
                        select: [{ type: "raw", fields: { "createUser": "user.nickname" } }]
                    },
                    {
                        table: uploadModel.table,
                        as: "upload",
                        type: "left",
                        on: {
                            "upload.id": songModel.qualifyField("cover")
                        },
                        select: [{ type: "raw", fields: { "cover": "upload.url" } }]
                    },
                    {
                        table: songArtistModel.table,
                        as: "songArtist",
                        type: "left",
                        on: { "songArtist.songId": songModel.qualifyField("id") }
                    },
                    {
                        table: artistModel.table,
                        as: "artist",
                        type: "left",
                        on: { "artist.id": "songArtist.artistId" },
                        select: [
                            {
                                type: "jsonArray",
                                alias: "artistList",
                                fields: {
                                    "id": "artist.id",
                                    "name": "artist.name"
                                }
                            }
                        ]
                    },
                ],
                group: [fields[0]],
                sort: { createdAt: "asc" },
                ...paginate(pageIndex, pageSize),
            }),
            songModel.count({
                query,
                distinct: true,
                field: fields[0],
                joins: [
                    {
                        table: songArtistModel.table,
                        as: "songArtist",
                        type: "right",
                        on: {
                            "songArtist.songId": songModel.qualifyField("id")
                        },
                    },

                ]
            })
        ])
        // await fillArtistList(list)
        ctx.success({
            list,
            total
        });
    },
}


