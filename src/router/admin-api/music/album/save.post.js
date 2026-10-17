import { albumModel, albumSongModel, albumArtistModel} from "@/database/model/music/album.js";
import { formatDate } from "@/utils/date.js";
export default {
    action: '保存专辑',
    logType: 'SAVE_MUSIC_ALBUM',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id, title, cover, releaseDate, company, type, genre, description, singerList, sort, isHot, enabled } = ctx.request.body;
        $validate(title, "专辑名称不能为空")
        $validate(cover, "专辑封面不能为空")
        $validate(releaseDate, "专辑发布日期不能为空")
        $validate(company, "专辑公司不能为空")
        $validate(type, "专辑类型不能为空")
        $validate(genre, "流派/风格不能为空")

        if (!cover || !cover.id) {
            return ctx.fail("歌曲演唱者不能为空")
        }
        try {
            await albumModel.withTransaction(async (model) => {
                const params = {
                    cover: cover.id,
                    releaseDate: formatDate(releaseDate),
                    title,
                    company,
                    type,
                    genre,
                    description,
                    sort,
                    isHot,
                    enabled,
                    createUserId: ctx.user.userId
                }
                const result = id
                    ? await model.updateOne({ id }, params)
                    : await model.insertOne(params)

                const albumId = result.insertId || id
                
                // 同步歌手
                await syncRelation({
                    model: albumArtistModel,
                    oldList: await albumArtistModel.findMany({ albumId }),
                    list: singerList,
                    key: 'artistId',
                    createInsertData: (artistId) => ({ albumId, artistId })
                })
            })

            ctx.success(null, id ? "更新成功" : "添加成功")
        } catch (error) {
            if (error.code == "ER_DUP_ENTRY") return ctx.fail("协议编号已存在")
            ctx.fail(error.message)
        }
    },
}


