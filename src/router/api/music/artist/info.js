
import artistModel from "@/database/model/music/artist.js"
import uploadModel from "@/database/model/upload.js"
export default {
    action: 'APP获取根据名称获取歌手信息',
    logType: 'APP_GET_ARTIST_NAME_BY_INFO',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { artistId } = ctx.request.query;
        $validate(artistId, "歌手id不能为空")
        const artist = await artistModel.aggregate({
            query: { [artistModel.qualifyField("id")]: artistId, [artistModel.qualifyField("enabled")]: 1 },
            fields: artistModel.qualifyFields(["id", "name", "realName", "avatar", "cover", "pinyin", "firstLetter", "gender", "area", "description","sort"]),
            joins: [{
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
            }]
        })



        if (artist.length > 0) {
            ctx.success(artist[0])
        } else {
            ctx.fail('歌手不存在')
        }
    },
}
