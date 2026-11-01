import { songModel, songArtistModel, songLangModel, songAudioModel } from "@/database/model/music/song.js";
import artistModel from "@/database/model/music/artist";
import uploadModel from "@/database/model/upload.js";
import { dictItemModel, dictTypeModel } from "@/database/model/system/dictionary.js"


export function getSongList(query, options = {}) {
    const { sort = {}, offset, limit, joins = [], fields = [] } = options;
    return songModel.aggregate({
        fields: [...songModel.qualifyFields(["id", "title", "mvUrl"]),
        ...fields,
        {
            duration: {
                $select: {
                    table: songAudioModel.table,
                    type: "raw",
                    fields: ["duration"],
                    query: {
                        [songModel.qualifyField("id")]: { $col: "songId" }
                    },
                    limit: 1
                }
            },
            language: {
                $select: {
                    table: songLangModel.table,
                    type: "jsonArray",
                    query: {
                        [songModel.qualifyField("id")]: { $col: songLangModel.qualifyField("songId") }
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
        ,
        query: {
            ...query,
            [songModel.qualifyField("enabled")]: 1
        },
        joins: [
            {
                table: uploadModel.table,
                as: "upload",
                type: "inner",
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
                type: "inner",
                on: {
                    "songArtist.songId": songModel.qualifyField("id")
                }
            },
            {
                table: artistModel.table,
                as: "artist",
                type: "inner",
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
            ...joins
        ],
        group: [songModel.qualifyField("id")],
        sort,
        offset,
        limit
    });
}



