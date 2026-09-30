import { playlistModel, playlistSongModel } from "@/database/model/music/playlist.js";
import { songModel, songArtistModel } from "@/database/model/music/song.js";
import uploadModel from "@/database/model/upload.js";

export default {
    action: '获取歌单歌曲',
    logType: 'GET_MUSIC_PLAYLIST_SONG',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { playlistId, pageIndex = 1, pageSize = 10 } = ctx.request.query;
        $validate(playlistId, "歌单id不能为空")
        const album = await playlistModel.findOne({ id: playlistId })
        if (!album) return ctx.fail("专辑不存在")
        const page = paginate(pageIndex, pageSize)
        const fields = songModel.qualifyFields(["id", "cover", "title", "enabled", "publishDate", "updatedAt", "enabled"]);
        const [list, total] = await Promise.all([
            playlistSongModel.aggregate({
                fields: fields,
                query: { playlistId },
                joins: [
                    {
                        table: songModel.table,
                        as: songModel.table,
                        on: {
                            [playlistSongModel.qualifyField('songId')]: songModel.qualifyField('id')
                        },
                    },
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
                ],
                group: [fields[0]],
                ...page
            }),
            playlistSongModel.count({ query: { playlistId } })
        ])


        await fillArtistList(list)

        ctx.success({ list, total });
    },
}