import { songModel, songArtistModel } from "@/database/model/music/song.js";
import artistModel from "@/database/model/music/artist.js";
import uploadModel from "@/database/model/upload.js";
export default {
    action: '获取歌曲列表',
    logType: 'GET_MUSIC_SONG_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { title, artist, pageIndex, pageSize } = ctx.request.query;
        const query = {}
        if (title && title.trim()) query.title = { $like: `%${title.trim()}%` }
        const fields = songModel.qualifyFields();
        if (artist && artist.trim()) {
            query[songModel.qualifyField("id")] = {
                $in: [{
                    table: songArtistModel.table,
                    fields: ["songId"], // 查出包含该歌手的歌曲 ID 列表
                    joins: [
                        {
                            table: artistModel.table,
                            as: "artistTable",
                            type: "inner",
                            on: {
                                "artistTable.id": "songArtist.artistId"
                            }
                        }
                    ],
                    query: {
                        "artistTable.name": { $like: `%${artist.trim()}%` }
                    }
                }]
            };
        }


        const [list, total] = await Promise.all([
            songModel.aggregate({
                fields,
                query,
                // 连表查询 创建人
                joins: [
                    {
                        table: "system_user",
                        as: "user",
                        type: "left",
                        on: {
                            "user.id": songModel.qualifyField("createUserId")
                        },
                        select: [
                            {
                                //选择表中的 用户昵称
                                type: "raw",
                                fields: {
                                    "createUser": "user.nickname"
                                }
                            }
                        ]
                    },
                    {
                        table: uploadModel.table,
                        as: "upload",
                        type: "left",
                        on: {
                            "upload.id": songModel.qualifyField("cover")
                        },
                        select: [
                            {
                                type: "raw",
                                fields: {
                                    "cover": "upload.url"
                                }
                            }
                        ]
                    },
                    {
                        table: songArtistModel.table,
                        as: "songArtist",
                        type: "left",
                        on: {
                            "songArtist.songId": songModel.qualifyField("id")
                        },
                        select: [
                            {
                                type: "array",
                                as: "artistList",
                                fields: {
                                    "artist": "songArtist.artistId"
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
        await fillArtistList(list)
        ctx.success({
            list,
            total
        });
    },
}


