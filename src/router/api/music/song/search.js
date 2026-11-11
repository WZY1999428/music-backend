
import artistModel from "@/database/model/music/artist.js"
import uploadModel from "@/database/model/upload.js"
import { songModel, songArtistModel } from "@/database/model/music/song.js"
import { albumModel, albumArtistModel } from "@/database/model/music/album.js"
import { playlistModel, playlistStatsModel, playlistTagModel } from "@/database/model/music/playlist.js"
import { dictItemModel, dictTypeModel } from "@/database/model/system/dictionary.js"

export default {
    action: 'APP搜索音乐',
    logType: 'APP_SEARCH_MUSIC',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        // complex album signle artist playlist
        const { keyword, type = "complex", pageIndex = 1, pageSize = 20 } = ctx.request.query;
        $validate(keyword, "搜索关键词不能为空");
        const funs = {
            playlist: getPlaylist,
            album: getAlbumList,
            artist: getArtistList,
            single: getSingleList,
        }

        if (type === "complex") {
            const [playlist, album, artist, song] = await getComplexList(keyword, ctx);
            ctx.success({ playlist: playlist[0], album: album[0], artist: artist[0], song: song[0] });
            return;
        } else {
            const [list, total] = await (funs[type] || getSingleList)(keyword, paginate(pageIndex, pageSize), true, ctx);
            ctx.success({ list, total });
            return;
        }
    },
}



// 获取歌单列表
async function getPlaylist(keyword, paginate, fetchCount = true) {
    const playlistIdField = playlistModel.qualifyField('id');

    const query = {
        $or: [
            { [playlistModel.qualifyField("title")]: { $like: `%${keyword}%` } },
            {
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
                        "dictItem.title": { $like: `%${keyword}%` },
                    }
                }
            }
        ],
        [playlistModel.qualifyField("enabled")]: 1,
    }

    const taks = [playlistModel.aggregate({
        fields: playlistModel.qualifyFields(['id', 'title', 'cover', 'isHot', 'sort', 'description']),
        joins: [
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
        query: query,
        group: [playlistIdField, "stats.favoriteTotal", "stats.playTotal", "stats.clickTotal"],
        ...paginate
    })]

    if (fetchCount) {
        query.$or[1].$exists.joins.unshift({
            table: dictTypeModel.table,
            as: 'dictType',
            on: { "dictType.code": { $eq: "PLAYLIST_TAG" } },
        })
        taks.push(playlistModel.count({ query }))
    }
    const result = await Promise.all(taks);
    result[0].forEach(item => item.isHot = item.isHot === 1)
    return result
}

// 获取专辑列表
async function getAlbumList(keyword, paginate, fetchCount = true) {
    const taks = [albumModel.aggregate({
        fields: albumModel.qualifyFields(['id', 'title', 'releaseDate', 'company', 'type', 'genre', 'description']),
        joins: [
            {
                table: albumArtistModel.table,
                as: 'albumArtist',
                type: "left",
                on: { "albumArtist.albumId": albumModel.qualifyField('id') },
            }, {
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
            },
            {
                table: uploadModel.table,
                as: 'upload',
                type: "left",
                on: { "upload.id": albumModel.qualifyField('cover') },
                select: [{
                    type: "raw",
                    fields: {
                        "cover": "upload.url",
                    }
                }]
            }
        ],
        group: [albumModel.qualifyField('id')],
        query: {
            title: { $like: `%${keyword}%` },
            [albumModel.qualifyField("enabled")]: 1
        },
        ...paginate
    })]

    if (fetchCount) {
        taks.push(albumModel.count({
            query: { title: { $like: `%${keyword}%` }, enabled: 1 },
        }))
    }
    const result = await Promise.all(taks);
    result[0].forEach(item => {
        item.genre = parseJson(item.genre)
    })
    return result
}


// 获取艺术家列表
function getArtistList(keyword, paginate, fetchCount = true) {
    const taks = [artistModel.aggregate({
        fields: artistModel.qualifyFields(['id', 'name', 'alias', 'pinyin', 'gender', 'description', 'sort']),
        joins: [
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
            name: { $like: `%${keyword}%` },
            [artistModel.qualifyField("enabled")]: 1
        },
        ...paginate
    })]

    if (fetchCount) {
        taks.push(artistModel.count({
            query: { name: { $like: `%${keyword}%` }, enabled: 1 },
        }))
    }

    return Promise.all(taks)
}

// 获取单曲列表
function getSingleList(keyword, paginate, fetchCount = true, ctx) {
    const query = [
        { [songModel.qualifyField("title")]: { $like: `%${keyword}%` } },
        { "artist.name": { $like: `%${keyword}%` } }]
    const taks = [getSongList({
        $or: query
    }, { ...paginate, userId: ctx.appUser?.userId })]
    if (fetchCount) {
        taks.push(songModel.count({
            query: {
                $or: query,
                [songModel.qualifyField("enabled")]: 1
            },
            field: songModel.qualifyField("id"),
            distinct: true,
            joins: [
                {
                    table: songArtistModel.table,
                    as: "songArtist",
                    type: "inner",
                    on: { "songArtist.songId": songModel.qualifyField("id") }
                },
                {
                    table: artistModel.table,
                    as: "artist",
                    type: "inner",
                    on: { "artist.id": "songArtist.artistId" }
                },
            ]
        }))
    }
    return Promise.all(taks)
}

// 获取综合列表
function getComplexList(keyword, ctx) {
    const paginate = { limit: 10 };
    const taks = [
        getPlaylist(keyword, paginate, false, ctx),
        getAlbumList(keyword, paginate, false, ctx),
        getArtistList(keyword, paginate, false, ctx),
        getSingleList(keyword, paginate, false, ctx),
    ]
    return Promise.all(taks)
}

