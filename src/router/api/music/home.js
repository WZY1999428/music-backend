import { songModel } from "@/database/model/music/song.js"
import bannerModel from "@/database/model/app/banner.js"
import uploadModel from "@/database/model/upload.js"
import { getSongList } from "@/utils/getSongList.js"

export default {
    action: '获取APP首页数据',
    logType: 'GET_APP_HOME_DATA',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const hotSongList = await getSongList({
            [songModel.qualifyField('enabled')]: 1
        }, {
            limit: 10,
            userId: ctx.appUser?.userId,
            sort: { [songModel.qualifyField("playTotal")]: "desc", [songModel.qualifyField("publishDate")]: "desc" }
        })

        const bannerList = await bannerModel.aggregate({
            query: { enabled: 1 },
            fields: bannerModel.qualifyFields(["id", "image", "type", "title", "value", "enabled", "desc"]),
            joins: [{
                table: uploadModel.table,
                on: {
                    [bannerModel.qualifyField('image')]: uploadModel.qualifyField('id')
                },
                select: [{
                    type: "raw",
                    fields: {
                        "image": uploadModel.qualifyField('url')
                    }
                }]
            }],
            sort: { sort: "asc" },
            limit: 5
        })
        ctx.success({
            hotSongList,
            bannerList
        });
    },
}