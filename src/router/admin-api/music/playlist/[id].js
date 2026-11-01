import uploadModel from "@/database/model/upload.js";
import { playlistModel, playlistTagModel } from "@/database/model/music/playlist.js";
import { dictItemModel, dictTypeModel } from "@/database/model/system/dictionary.js";


export default {
    action: '获取歌单详情',
    enableLog: false,
    logType: 'GET_MUSIC_PLAYLIST_DETAIL',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        $validate(id, "歌单ID不能为空")
        const playlistId = playlistModel.qualifyField("id");
        const song = await playlistModel.aggregate({
            fields: [...playlistModel.qualifyFields()],
            query: {
                [playlistId]: id,
            },
            joins: [
                {
                    table: uploadModel.table,
                    as: "upload",
                    type: "left",
                    on: {
                        "upload.id": playlistModel.qualifyField("cover")
                    },
                    select: [
                        {
                            type: "jsonObject",
                            alias: "cover",
                            fields: { "url": "upload.url", id: "upload.id" }
                        }
                    ]
                },
                {
                    table: playlistTagModel.table,
                    as: "playlistTag",
                    type: "left",
                    on: {
                        "playlistTag.playlistId": playlistId,
                    },
                },
                {
                    table: dictTypeModel.table,
                    as: "dictType",
                    on: { "dictType.code": { $eq: "PLAYLIST_TAG" } },
                },
                {
                    table: dictItemModel.table,
                    as: "dictItem",
                    type: "left",
                    on: { "playlistTag.tag": "dictItem.value", "dictType.id": "dictItem.dictId" },
                    select: [
                        {
                            type: "array",
                            alias: "tags",
                            fields: {
                                "tags": "dictItem.value"
                            }
                        }
                    ]
                },
            ],
            group: [playlistId]

        })
        if (!song.length) return ctx.fail("歌单不存在")
        ctx.success(song[0])
    }
}

