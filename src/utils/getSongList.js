import { songModel, songArtistModel, songLangModel, songAudioModel, favoriteSongModel } from "@/database/model/music/song.js";
import artistModel from "@/database/model/music/artist.js";
import uploadModel from "@/database/model/upload.js";
import { dictItemModel, dictTypeModel } from "@/database/model/system/dictionary.js"


export async function getSongList(query, options = {}) {
    const { sort = {}, offset, limit, joins = [], fields = [], userId } = options;

    const songIdField = songModel.qualifyField("id")

    const defaultJoins = [
        {
            table: uploadModel.table,
            as: "upload",
            on: {
                "upload.id": songModel.qualifyField("cover")
            },
            select: [
                {
                    type: "raw",
                    fields: { cover: "upload.url" }
                }
            ]
        },
        {
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
        },
    ]


    const defailtFields = [
        ...songModel.qualifyFields(["id", "title", "mvUrl", "publishDate"]),
        ...fields,
        {
            duration: {
                $select: {
                    table: songAudioModel.table,
                    fields: ["duration"],
                    query: {
                        [songIdField]: { $col: "songId" }
                    },
                    limit: 1
                }
            },
            language: {
                $select: {
                    table: songLangModel.table,
                    query: {
                        [songIdField]: { $col: songLangModel.qualifyField("songId") }
                    },
                    joins: [
                        {
                            table: dictItemModel.table,
                            as: "dictItem",
                            type: "inner",
                            on: {
                                "dictItem.value": songLangModel.qualifyField("lang")
                            },
                            select: [{
                                type: "jsonArray",
                                alias: "lang",
                                fields: {
                                    id: "dictItem.id",
                                    lang: "dictItem.title"
                                }
                            }]
                        },
                        {
                            table: dictTypeModel.table,
                            as: "dictType",
                            type: "inner",
                            on: {
                                "dictType.id": "dictItem.dictId",
                            },
                        },
                    ]
                }
            }
        }]


    if (userId) {
        defailtFields.push({
            isLike: {
                $exists: {
                    table: favoriteSongModel.table,
                    fields: ["id"],
                    query: {
                        songId: { $col: songIdField },
                        userId: userId
                    }
                }
            }
        })
    }
    const songlist = await songModel.aggregate({
        fields: defailtFields,
        query: {
            ...query,
            [songModel.qualifyField("enabled")]: 1
        },
        joins: [...defaultJoins, ...joins],
        group: [songIdField],
        sort,
        offset,
        limit
    });

    songlist.forEach(item => {
        item.isLike = item.isLike == 1
    })
    return songlist
}



