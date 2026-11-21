import artistModel, { artistAliasModel } from "@/database/model/music/artist.js";
import uploadModel from "@/database/model/upload.js";
import { dictItemModel, dictTypeModel } from "@/database/model/system/dictionary.js"
export default {
    action: '获取歌手列表',
    logType: 'GET_MUSIC_ARTIST_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { title, dateRange = [], area, gender, status, pageIndex, pageSize } = ctx.request.query;
        const query = {}
        let artistAliasJoin = []
        if (title && title.trim()) {
            query["$or"] = [
                { name: { $like: `${title.trim()}%` } },
                { "artistAlias.alias": { $like: `${title.trim()}%` } }
            ]
            artistAliasJoin = [{
                table: artistAliasModel.table,
                as: "artistAlias",
                type: "left",
                on: { "artistAlias.artistId": artistModel.qualifyField("id") }
            }]
        }

        if (parseInt(status) === 0 || parseInt(status) === 1) {
            query[artistModel.qualifyField("enabled")] = status;
        }

        if (dateRange.length > 1) {
            const range = toDateTimeRange(dateRange)
            query[artistModel.qualifyField("createdAt")] = { $between: range };
        }

        const queryJoins = []

        if (gender) {
            query["genderDictItem.value"] = gender
            queryJoins.push(...[
                {
                    table: dictTypeModel.table,
                    as: "genderType",
                    on: { "genderType.code": { $eq: "ARTIST_GENDER" } }
                },
                {
                    table: dictItemModel.table,
                    as: "genderDictItem",
                    on: { "genderDictItem.dictId": "genderType.id", [artistModel.qualifyField("gender")]: "genderDictItem.value" }
                },
            ])
        }

        if (area) {
            query["areaDictItem.value"] = area
            queryJoins.push(...[
                {
                    table: dictTypeModel.table,
                    as: "areaType",
                    on: { "areaType.code": { $eq: "ARTIST_REGION" } }
                },
                {
                    table: dictItemModel.table,
                    as: "areaDictItem",
                    on: { "areaDictItem.dictId": "areaType.id", [artistModel.qualifyField("area")]: "areaDictItem.value" }
                },
            ])
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
                ...queryJoins,
                ...artistAliasJoin,
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
                group: [artistModel.qualifyField("id")],
                ...page,
            }),
            artistModel.count({
                query,
                joins: queryJoins.concat(artistAliasJoin),
                field: artistModel.qualifyField("id"),
                distinct: true
            })
        ])
        ctx.success({
            list,
            total
        });
    },
}