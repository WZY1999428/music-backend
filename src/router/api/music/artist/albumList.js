
import { albumModel, albumArtistModel } from "@/database/model/music/album.js"
import artistModel from "@/database/model/music/artist.js"
import uploadModel from "@/database/model/upload.js"
export default {
    action: 'APP获取歌手专辑列表',
    logType: 'APP_GET_ARTIST_ALBUM_LIST',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { artistId } = ctx.request.query;
        $validate(artistId, "歌手id不能为空")
        const albumList = await albumModel.aggregate({
            query: {
                [albumModel.qualifyField("enabled")]: 1,
                $exists: {
                    table: albumArtistModel.table,
                    query: {
                        artistId: artistId
                    }
                }
            },
            fields: albumModel.qualifyFields(["id", "title", "releaseDate", "company", "type", "genre", "description"]),
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
                    on: { "albumArtist.albumId": albumModel.qualifyField("id") },
                },
                {
                    table: artistModel.table,
                    as: 'artist',
                    type: "left",
                    on: { "artist.id": "albumArtist.artistId" },
                    select: [
                        {
                            type: "jsonArray",
                            alias: "artists",
                            fields: {
                                "artistId": "artist.id",
                                "artistName": "artist.name",
                            }
                        }
                    ]
                }
            ],
            group: albumModel.qualifyFields(["id"])
        })
        albumList.forEach(item => {
            item.genre = parseJson(item.genre)
        })
        ctx.success(albumList)
    },
}
