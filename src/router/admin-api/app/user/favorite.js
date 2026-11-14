import userFavoriteModel from "@/database/model/app/user/userFavorite.js"
import artistModel, { artistFavoriteModel } from "@/database/model/music/artist.js"
import { playlistModel, favoritePlaylistModel } from "@/database/model/music/playlist.js"
import { albumModel, favoriteArostModel } from "@/database/model/music/album.js"
import uploadModel from "@/database/model/upload.js";
import { paginate } from "@/utils/paginate.js"
export default {
    action: '获取用户收藏',
    logType: 'GET_USER_FAVORITE',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { userId, type = "album", pageIndex, pageSize } = ctx.request.query;
        if (type == "album") {
            const [list, count] = await findFavoriteAlbum(userId, pageIndex, pageSize)
            ctx.success({ list, count });
        } else if (type == "artist") {
            const [list, count] = await findFavoriteArtist(userId, pageIndex, pageSize)
            ctx.success({ list, count });
        } else if (type == "playlist") {
            const [list, count] = await findFavoritePlaylist(userId, pageIndex, pageSize)
            ctx.success({ list, count });
        }

    },
}

function findFavoritePlaylist(userId, pageIndex, pageSize) {
    const fields = playlistModel.qualifyFields()
    return Promise.all([
        favoritePlaylistModel.aggregate({
            query: { [favoritePlaylistModel.qualifyField("userId")]: userId },
            fields,
            joins: [{
                table: playlistModel.table,
                type: "left",
                on: { [playlistModel.qualifyField("id")]: favoritePlaylistModel.qualifyField("playlistId") },
            }, {
                table: uploadModel.table,
                as: "upload",
                type: "left",
                on: { "upload.id": playlistModel.qualifyField("cover") },
                select: [{ type: "raw", fields: { "cover": "upload.url" } }]
            }],
            ...paginate(pageIndex, pageSize)
        }),
        userFavoriteModel.count({ query: { userId: userId } })
    ])
}

function findFavoriteArtist(userId, pageIndex, pageSize) {
    const fields = artistModel.qualifyFields()
    return Promise.all([
        artistFavoriteModel.aggregate({
            query: { [artistFavoriteModel.qualifyField("userId")]: userId },
            fields,
            joins: [{
                table: artistModel.table,
                type: "left",
                as: artistModel.table,
                on: { [artistModel.qualifyField("id")]: artistFavoriteModel.qualifyField("artistId") },
            }, {
                table: uploadModel.table,
                as: "upload",
                type: "left",
                on: { "upload.id": artistModel.qualifyField("avatar") },
                select: [{ type: "raw", fields: { "avatar": "upload.url" } }]
            }],
            ...paginate(pageIndex, pageSize)
        }),
        artistFavoriteModel.count({ query: { userId: userId } })
    ])
}


function findFavoriteAlbum(userId, pageIndex, pageSize) {
    const fields = albumModel.qualifyFields()
    return Promise.all([
        favoriteArostModel.aggregate({
            query: { [favoriteArostModel.qualifyField("userId")]: userId },
            fields,
            joins: [{
                table: albumModel.table,
                type: "left",
                on: { [albumModel.qualifyField("id")]: favoriteArostModel.qualifyField("albumId") },
            }, {
                table: uploadModel.table,
                as: "upload",
                type: "left",
                on: { "upload.id": albumModel.qualifyField("cover") },
                select: [{ type: "raw", fields: { "avatar": "upload.url" } }]
            }],
            ...paginate(pageIndex, pageSize)
        }),
        favoriteArostModel.count({ query: { userId: userId } })
    ])
}