import { albumModel, albumArtistModel, favoriteArostModel, albumSongModel } from "@/database/model/music/album.js"
import uploadModel from "@/database/model/upload.js"
import artistModel from "@/database/model/music/artist.js"

export default {
    action: '获取收藏专辑',
    logType: 'GET_FAVORITE_ALBUM',
    auth: true,
    /** @type {Controller} */
    handler: async (ctx) => {

        const fields = albumModel.qualifyFields(["id", "title", "releaseDate", "company", "type", "genre", "description"])
        const albumIdField = albumModel.qualifyField("id");

        fields.push({
            songCount: {
                $count: {
                    table: albumSongModel.table,
                    fields: ["id"],
                    query: {
                        albumId: { $col: albumIdField },
                    }
                }
            },
        })


        if (ctx.appUser?.userId) {
            fields.push({
                isLike: {
                    $exists: {
                        table: favoriteArostModel.table,
                        fields: ["id"],
                        query: {
                            albumId: { $col: albumIdField },
                            userId: ctx.appUser?.userId
                        }
                    }
                }
            })
        }


        const albumList = await albumModel.aggregate({
            query: {
                [albumModel.qualifyField("enabled")]: 1
            },
            fields,
            joins: [
                {
                    table: favoriteArostModel.table,
                    as: 'favorite',
                    on: { "favorite.albumId": albumIdField, "favorite.userId": { $eq: ctx.appUser?.userId } },
                },
                {
                    table: uploadModel.table,
                    as: 'uploadCover',
                    type: "left",
                    on: { "uploadCover.id": albumModel.qualifyField('cover') },
                    select: [{
                        type: "raw",
                        fields: {
                            "cover": "uploadCover.url",
                        }
                    }]
                },
                {
                    table: albumArtistModel.table,
                    as: 'albumArtist',
                    type: "left",
                    on: { "albumArtist.albumId": albumModel.qualifyField('id') },
                },
                {
                    table: artistModel.table,
                    as: 'artist',
                    type: "left",
                    on: { "artist.id": "albumArtist.artistId" },
                    select: [{
                        type: "jsonArray",
                        alias: "artists",
                        fields: {
                            "artistId": "artist.id",
                            "artistName": "artist.name",
                        }
                    }]
                }
            ],
            group: albumModel.qualifyFields(["id"])
        })

        albumList.forEach(item => {
            item.genre = parseJson(item.genre)
            item.isLike = item.isLike == 1
        })
        ctx.success(albumList)
    },

}