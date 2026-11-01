
import { albumModel, albumArtistModel } from "@/database/model/music/album.js"
import artistModel from "@/database/model/music/artist.js"

import uploadModel from "@/database/model/upload.js"
export default {
    action: 'APP获取专辑信息',
    logType: 'APP_GET_ALBUM_INFO',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { albumId } = ctx.request.query;
        $validate(albumId, "专辑id不能为空")
        const album = await albumModel.aggregate({
            query: {
                [albumModel.qualifyField("id")]: albumId,
                [albumModel.qualifyField("enabled")]: 1
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
            ctx.success(album[0])
        } else {
            ctx.fail('专辑不存在')
        }
    },
}
