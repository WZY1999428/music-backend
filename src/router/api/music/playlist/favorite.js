import { playlistModel, playlistStatsModel, playlistTagModel, favoritePlaylistModel, playlistSongModel } from "@/database/model/music/playlist.js"

import { dictItemModel, dictTypeModel } from "@/database/model/system/dictionary.js"
import uploadModel from "@/database/model/upload.js"
export default {
    action: '获取收藏歌单',
    logType: 'GET_FAVORITE_SONGS',
    enableLog: false,
    auth: true,
    /** @type {Controller} */
    handler: async (ctx) => {
        const userId = ctx.appUser.userId
        const playlistIdField = playlistModel.qualifyField('id')
        const fields = playlistModel.qualifyFields(['id', 'title', 'cover', 'isHot', 'sort', 'description']);
        fields.push({
            songCount: {
                $count: {
                    table: playlistSongModel.table,
                    fields: ["id"],
                    query: {
                        playlistId: { $col: playlistIdField },
                    }
                }
            },
        })

        const result = await playlistModel.aggregate({
            fields: fields,
            query: {
                [playlistModel.qualifyField("enabled")]: 1,
                $exists: {
                    table: playlistTagModel.table,
                    joins: [{
                        table: dictItemModel.table,
                        as: 'dictItem',
                        on: { "dictItem.value": playlistTagModel.qualifyField("tag") },
                    }],
                    query: {
                        [playlistTagModel.qualifyField("playlistId")]: { $col: playlistIdField },
                        "dictItem.dictId": { $col: "dictType.id" },
                    }
                }
            },
            joins: [
                {
                    table: favoritePlaylistModel.table,
                    as: 'favorite',
                    on: { "favorite.playlistId": playlistIdField, "favorite.userId": { $eq: userId } },
                },
                {
                    table: playlistStatsModel.table,
                    as: 'stats',
                    on: { "stats.playlistId": playlistIdField },
                    select: [{
                        type: "raw",
                        fields: {
                            "favoriteTotal": "stats.favoriteTotal",
                            "playTotal": "stats.playTotal",
                            "clickTotal": "stats.clickTotal",
                        }
                    }]
                }, {
                    table: uploadModel.table,
                    as: 'upload',
                    type: "left",
                    on: { "upload.id": playlistModel.qualifyField('cover') },
                    select: [{ type: "raw", fields: { "cover": "upload.url" } }]
                },
                {
                    table: playlistTagModel.table,
                    as: 'playlistTag',
                    type: "left",
                    on: { "playlistTag.playlistId": playlistIdField },
                },
                {
                    table: dictTypeModel.table,
                    as: 'dictType',
                    on: { "dictType.code": { $eq: "PLAYLIST_TAG" } },
                },
                {
                    table: dictItemModel.table,
                    as: 'dictItem2',
                    type: "left",
                    on: { "dictItem2.dictId": "dictType.id", "dictItem2.value": "playlistTag.tag" },
                    select: [{
                        type: "jsonArray",
                        alias: "tags",
                        fields: { "title": "dictItem2.title", "value": "dictItem2.value", "id": "dictItem2.id" }
                    }]
                }
            ],
            group: [playlistIdField, "stats.favoriteTotal", "stats.playTotal", "stats.clickTotal"],
        })

        result.forEach((it) => it.isLike = true)
        ctx.success(result)
    }
}