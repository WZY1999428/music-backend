import { songModel, songArtistModel } from "@/database/model/music/song.js";
import { albumSongModel } from "@/database/model/music/album.js";
import { playlistSongModel } from "@/database/model/music/playlist.js";

import artistModel from "@/database/model/music/artist.js";
import uploadModel from "@/database/model/upload.js";

export default {
    action: '获取专辑选择歌曲列表',
    logType: 'GET_MUSIC_ALBUM_SONG_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { title, artist, albumId, playlistId, pageIndex, pageSize } = ctx.request.query;
        const query = {}
        if (title && title.trim()) query.title = { $like: `%${title.trim()}%` }

        if (artist && artist.trim()) {
            const artistIds = await artistModel.findMany({ name: { $like: `%${artist}%` } }, { fields: ["id"] })
            if (artistIds.length > 0) {
                query["songArtist.artistId"] = { $in: artistIds.map(item => item.id) }
            }
        }

        if (albumId && !playlistId) {
            const albumSong = await albumSongModel.findMany({ albumId }, { fields: ["songId"] })
            if (albumSong.length > 0) {
                query[songModel.qualifyField("id")] = { $nin: albumSong.map(item => item.songId) }
            }
        }

        if (playlistId && !albumId) {
            const playlistSong = await playlistSongModel.findMany({ playlistId }, { fields: ["songId"] })
            if (playlistSong.length > 0) {
                query[songModel.qualifyField("id")] = { $nin: playlistSong.map(item => item.songId) }
            }
        }

        const page = paginate(pageIndex, pageSize);
        const fields = songModel.qualifyFields(["id", "title", "cover", "enabled", "publishDate", "updatedAt", "enabled"]);
        const [list, total] = await Promise.all([
            songModel.aggregate({
                fields,
                query,
                // 连表查询 创建人
                joins: [
                    {
                        table: "system_user",
                        as: "user",
                        type: "left",
                        on: {
                            "user.id": songModel.qualifyField("createUserId")
                        },
                        select: [
                            {
                                //选择表中的 用户昵称
                                type: "raw",
                                fields: {
                                    "createUser": "user.nickname"
                                }
                            }
                        ]
                    },
                    {
                        table: uploadModel.table,
                        as: "upload",
                        type: "left",
                        on: {
                            "upload.id": songModel.qualifyField("cover")
                        },
                        select: [
                            {
                                type: "raw",
                                fields: {
                                    "cover": "upload.url"
                                }
                            }
                        ]
                    },
                    {
                        table: songArtistModel.table,
                        as: "songArtist",
                        type: "left",
                        on: {
                            "songArtist.songId": songModel.qualifyField("id")
                        },
                        select: [
                            {
                                type: "array",
                                as: "artistList",
                                fields: {
                                    "artist": "songArtist.artistId"
                                }
                            }
                        ]
                    },

                ],
                group: [fields[0]],
                sort: { createdAt: "asc" },
                ...page,
            }),
            songModel.count({
                query,
                distinct: true,
                field: fields[0],
                joins: [
                    {
                        table: songArtistModel.table,
                        as: "songArtist",
                        type: "right",
                        on: {
                            "songArtist.songId": songModel.qualifyField("id")
                        },
                    },
                ]
            })
        ])
        const artistIds = list.flatMap(item => item.artistList || [])
        if (artistIds.length) {
            const artistList = await artistModel.findMany({ id: { $in: artistIds } }, { fields: ["id", "name", "realName"] })
            const artistMap = new Map(artistList.map(artist => [artist.id, artist]))
            list.forEach(item => {
                item.artistList = item.artistList.map(id => {
                    const artist = artistMap.get(id)
                    if (artist) {
                        return {
                            id,
                            name: artist.name,
                            realName: artist.realName
                        }
                    }
                    return null
                }).filter(Boolean)
            })
        }
        ctx.success({
            list,
            total
        });
    },
}