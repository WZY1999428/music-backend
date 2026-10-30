
import { playlistModel, playlistStatsModel } from "@/database/model/music/playlist.js"
import { albumModel, albumArtistModel } from "@/database/model/music/album.js"
import artistModel from "@/database/model/music/artist.js"
import { songModel, songArtistModel } from "@/database/model/music/song.js"
import uploadModel from "@/database/model/upload.js"
import { paginate } from "@/utils/paginate";
import { getSongList } from "@/utils/getSongList"

export default {
    action: 'APP搜索音乐',
    logType: 'APP_SEARCH_MUSIC',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        // complex album signle artist playlist
        const { keyword, type = "complex", pageIndex = 1, pageSize = 20 } = ctx.request.query;
        $validate(keyword, "搜索关键词不能为空");
        const funs = {
            playlist: getPlaylist,
            album: getAlbumList,
            artist: getArtistList,
            signle: getSingleList,
        }

        if (type === "complex") {
            const [playlist, album, artist, song] = await getComplexList(keyword);
            ctx.success({ playlist: playlist[0], album: album[0], artist: artist[0], song: song[0] });
            return;
        } else {
            const [list, total] = await (funs[type] || getSingleList)(keyword, paginate(pageIndex, pageSize));
            ctx.success({ list, total });
            return;
        }
    },
}



// 获取歌单列表
function getPlaylist(keyword, paginate, fetchCount = true) {
    const taks = [playlistModel.aggregate({
        fields: playlistModel.qualifyFields(['title', 'cover', 'isHot', 'sort', 'description']),
        joins: [
            {
                table: playlistStatsModel.table,
                as: 'stats',
                on: { "stats.playlistId": playlistModel.qualifyField('id') },
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
                select: [{
                    type: "raw",
                    fields: {
                        "cover": "upload.url",
                    }
                }]
            }
        ],
        query: {
            title: { $like: `%${keyword}%` },
            [playlistModel.qualifyField("enabled")]: 1
        },
        ...paginate
    })]

    if (fetchCount) {
        taks.push(playlistModel.count({
            query: { title: { $like: `%${keyword}%` }, enabled: 1 },
        }))
    }

    return Promise.all(taks)
}
// 获取专辑列表
function getAlbumList(keyword, paginate, fetchCount = true) {
    const taks = [albumModel.aggregate({
        fields: albumModel.qualifyFields(['title', 'releaseDate', 'company', 'type', 'genre', 'description']),
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
                    type: "raw",
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

    return Promise.all(taks)
}
// 获取艺术家列表
function getArtistList(keyword, paginate, fetchCount = true) {
    const taks = [artistModel.aggregate({
        fields: artistModel.qualifyFields(['name', 'realName', 'pinyin', 'gender', 'description', 'sort']),
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
function getSingleList(keyword, paginate, fetchCount = true) {
    const query = [
        { [songModel.qualifyField("title")]: { $like: `%${keyword}%` } },
        { "artist.name": { $like: `%${keyword}%` } }]
    const taks = [getSongList({
        $or: query
    }, { ...paginate })]
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
function getComplexList(keyword) {
    const paginate = { limit: 10 };
    const taks = [
        getPlaylist(keyword, paginate, false),
        getAlbumList(keyword, paginate, false),
        getArtistList(keyword, paginate, false),
        getSingleList(keyword, paginate, false),
    ]
    return Promise.all(taks)
}

