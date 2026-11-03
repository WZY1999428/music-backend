import uploadModel from "@/database/model/upload.js"
import { playlistModel, playlistStatsModel, playlistTagModel } from "@/database/model/music/playlist.js"
import { dictItemModel, dictTypeModel } from "@/database/model/system/dictionary.js"
import bannerModel from "@/database/model/app/banner.js";

export default {
    action: '获取歌单广场',
    logType: 'GET_PLAYLIST_SQUARE',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const sort = Object.fromEntries(["stats.favoriteTotal", "stats.playTotal", "stats.clickTotal"].map(key => [key, "desc"]));
        //  获取热门歌单
        const [hotPlaylist] = await getPlaylist({ sort, fetchCount: false })
        // 推荐和类型
        const banner = await getBanner()
        ctx.success({ hotPlaylist, banner });
    },
}

async function getBanner() {
    return bannerModel.aggregate({
        fields: bannerModel.qualifyFields(["id", "title", "value", "desc", "type"]),
        query: {
            [bannerModel.qualifyField("type")]: "playlist",
            [bannerModel.qualifyField("enabled")]: 1
        },
        joins: [
            {
                table: uploadModel.table,
                as: 'upload',
                type: "left",
                on: { "upload.id": bannerModel.qualifyField('image') },
                select: [{ type: "raw", fields: { "cover": "upload.url" } }]
            }
        ],
        limit: 5,
        sort: {
            sort: "desc"
        }
    })
}

// 获取歌单列表
async function getPlaylist(options = {}) {
    const { type, paginate, fetchCount = true, sort = {} } = options;
    const playlistIdField = playlistModel.qualifyField('id');
    const existsQuery = {
        [playlistTagModel.qualifyField("playlistId")]: { $col: playlistIdField },
        "dictItem.dictId": { $col: "dictType.id" },
    }
    if (type && type != "recommend") {
        existsQuery["dictItem.value"] = type;
    }
    const query = {
        $or: [
            {
                $exists: {
                    table: playlistTagModel.table,
                    joins: [{
                        table: dictItemModel.table,
                        as: 'dictItem',
                        on: { "dictItem.value": playlistTagModel.qualifyField("tag") },
                    }],
                    query: existsQuery
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
        sort,
        group: [playlistIdField, "stats.favoriteTotal", "stats.playTotal", "stats.clickTotal"],
        ...paginate
    })]

    if (fetchCount) {
        query.$or[0].$exists.joins.unshift({
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
