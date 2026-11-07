
import { albumModel, albumArtistModel, albumSongModel, favoriteArostModel } from "@/database/model/music/album.js"
import artistModel from "@/database/model/music/artist.js"
import uploadModel from "@/database/model/upload.js"
export default {
    action: 'APP获取专辑信息',
    logType: 'APP_GET_ALBUM_INFO',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { albumId } = ctx.request.query;
        $validate(albumId, "专辑id不能为空")

        const fields = albumModel.qualifyFields(["id", "title", "releaseDate", "company", "type", "genre", "description"])
        fields.push({
            songCount: {
                $count: {
                    table: albumSongModel.table,
                    fields: ["id"],
                    query: {
                        albumId: { $eq: albumId },
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
                            albumId: Number(albumId),
                            userId: ctx.appUser?.userId
                        }
                    }
                }
            })
        }


        const album = await albumModel.aggregate({
            query: {
                [albumModel.qualifyField("id")]: albumId,
                [albumModel.qualifyField("enabled")]: 1
            },
            fields,
            joins: [
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

        if (album.length > 0) {
            album[0].genre = parseJson(album[0].genre)
            album[0].isLike = album[0].isLike == 1
            ctx.success(album[0])
        } else {
            ctx.fail('专辑不存在')
        }
    },
}
