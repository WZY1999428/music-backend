
import artistModel, { artistFavoriteModel } from "@/database/model/music/artist.js"
import uploadModel from "@/database/model/upload.js"
export default {
    action: 'APP获取根据名称获取歌手信息',
    logType: 'APP_GET_ARTIST_NAME_BY_INFO',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { artistId } = ctx.request.query;
        $validate(artistId, "歌手id不能为空")
        const fields = artistModel.qualifyFields(["id", "name", "alias", "avatar", "cover", "pinyin", "firstLetter", "gender", "area", "description", "sort"]);
        const arFieldId = artistModel.qualifyField("id");
        if (ctx.appUser?.userId) {
            fields.push({
                isLike: {
                    $exists: {
                        table: artistFavoriteModel.table,
                        fields: ["artistId"],
                        query: {
                            artistId: { $col: arFieldId },
                            userId: ctx.appUser?.userId
                        }
                    }
                }
            })
        }
        const artists = await artistModel.aggregate({
            query: { [arFieldId]: artistId, [artistModel.qualifyField("enabled")]: 1 },
            fields,
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

        if (artists.length > 0) {
            const artistInfo = artists[0];
            artistInfo.isLike = artistInfo.isLike == 1;
            ctx.success(artistInfo)
        } else {
            ctx.fail('歌手不存在')
        }
    },
}
