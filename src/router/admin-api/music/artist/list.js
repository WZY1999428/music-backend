import artistModel from "@/database/model/music/artist.js";
import uploadModel from "@/database/model/upload.js";
import { dictItemModel, dictTypeModel } from "@/database/model/system/dictionary.js"
export default {
    action: '获取歌手列表',
    logType: 'GET_MUSIC_ARTIST_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { title, dateRange = [], area, status, pageIndex, pageSize } = ctx.request.query;
        const query = {}
        if (title && title.trim()) query.name = { $like: `%${title.trim()}%` }

        if (parseInt(status) === 0 || parseInt(status) === 1) {
            query[artistModel.qualifyField("enabled")] = status;
        }

        if (dateRange.length > 1) {
            const range = toDateTimeRange(dateRange)
            query[artistModel.qualifyField("createdAt")] = { $between: range };
        }

        let areaJoins = []
        if (area) {
            query["dictItem.value"] = area

            areaJoins = [
                {
                    table: dictTypeModel.table,
                    as: "dictType",
                    on: { "dictType.code": { $eq: "ARTIST_REGION" } }
                },
                {
                    table: dictItemModel.table,
                    as: "dictItem",
                    on: { "dictItem.dictId": "dictType.id", [artistModel.qualifyField("area")]: "dictItem.value" }
                },
            ]
        }

        const page = paginate(pageIndex, pageSize);


        const fields = artistModel.qualifyFields();
        const [list, total] = await Promise.all([
            artistModel.aggregate({
                fields,
                query,
                // 连表查询 创建人
                joins: [{
                    table: "system_user",
                    as: "user",
                    type: "left",
                    on: {
                        "user.id": artistModel.qualifyField("createUserId")
                    },
                    select: [
                        {
                            type: "raw",
                            fields: {
                                "createUser": "user.nickname"
                            }
                        }
                    ]
                },
                ...areaJoins,
                {
                    table: uploadModel.table,
                    as: "upload",
                    type: "left",
                    on: {
                        "upload.id": artistModel.qualifyField("avatar")
                    },
                    select: [
                        {
                            type: "raw",
                            fields: {
                                "avatar": "upload.url"
                            }
                        }
                    ]
                }],
                sort: { createdAt: "asc" },
                ...page,
            }),
            artistModel.count({
                query,
                joins: areaJoins

            })
        ])
        ctx.success({
            list,
            total
        });
    },
}