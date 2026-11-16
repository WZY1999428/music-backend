import artistModel, { artistAliasModel } from "@/database/model/music/artist.js";
import uploadModel from "@/database/model/upload.js";
export default {
    action: '获取歌手详情',
    enableLog: false,
    logType: 'GET_MUSIC_ARTIST_DETAIL',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        console.log(artistModel.qualifyFields());
        const artist = await artistModel.aggregate({
            fields: artistModel.qualifyFields(),
            query: { [artistModel.qualifyField("id")]: id },
            joins: [{
                table: uploadModel.table,
                as: "coverUpload",
                type: "left",
                on: { "coverUpload.id": artistModel.qualifyField("cover") },
                select: [{ type: "jsonObject", alias: "cover", fields: { "url": "coverUpload.url", id: "coverUpload.id" } }]
            }, {
                table: uploadModel.table,
                as: "avatarUpload",
                type: "left",
                on: { "avatarUpload.id": artistModel.qualifyField("avatar") },
                select: [{ type: "jsonObject", alias: "avatar", fields: { "url": "avatarUpload.url", id: "avatarUpload.id" } }]
            }, {
                table: artistAliasModel.table,
                as: "artistAlias",
                type: "left",
                on: { "artistAlias.artistId": artistModel.qualifyField("id") },
                select: [{
                    type: "jsonArray",
                    alias: "alias",
                    fields: {
                        alias: "artistAlias.alias",
                        id: "artistAlias.id"
                    }
                }]
            }],
            group: artistModel.qualifyFields(["id"]),
            limit: 1
        })
        if (!artist.length) return ctx.fail("歌手不存在")
        ctx.success(artist[0])
    },
}

