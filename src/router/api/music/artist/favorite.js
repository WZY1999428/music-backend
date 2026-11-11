import artistModel, { artistFavoriteModel } from "@/database/model/music/artist.js"
import { songArtistModel } from "@/database/model/music/song.js"

import uploadModel from "@/database/model/upload.js"
export default {
    action: '获取收藏歌手',
    logType: 'GET_FAVORITE_ARTIST',
    auth: true,
    /** @type {Controller} */
    handler: async (ctx) => {
        const userId = ctx.appUser.userId

        const fields = artistModel.qualifyFields(['id', 'name', 'alias', 'pinyin', 'gender', 'description', 'sort'])

        fields.push({
            songCount: {
                $count: {
                    table: songArtistModel.table,
                    fields: ["id"],
                    query: {
                        artistId: { $col: artistModel.qualifyField("id") },
                    }
                }
            },
        })

        const result = await artistModel.aggregate({
            fields,
            joins: [
                {
                    table: artistFavoriteModel.table,
                    as: 'favorite',
                    on: { "favorite.artistId": artistModel.qualifyField("id"), "favorite.userId": { $eq: userId } },
                },
                {
                    table: uploadModel.table,
                    as: 'uploadAvatar',
                    type: "left",
                    on: { "uploadAvatar.id": artistModel.qualifyField('avatar') },
                    select: [{
                        type: "raw",
                        fields: {
                            "avatar": "uploadAvatar.url",
                        }
                    }]
                },
                {
                    table: uploadModel.table,
                    as: 'uploadCover',
                    type: "left",
                    on: { "uploadCover.id": artistModel.qualifyField('cover') },
                    select: [{
                        type: "raw",
                        fields: {
                            "cover": "uploadCover.url",
                        }
                    }]
                }
            ],
            query: {
                [artistModel.qualifyField("enabled")]: 1
            },
        })

        console.log(result);
        

        ctx.success(result)
    }
}

