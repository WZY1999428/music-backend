import { playlistModel, playlistStatsModel } from "@/database/model/music/playlist.js";
export default {
    action: '保存歌单',
    logType: 'SAVE_MUSIC_PLAYLIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id, title, cover, sort, isHot, enabled = 1, description } = ctx.request.body;

        $validate(title, "歌单名称不能为空")
        if (!cover || !cover.id) {
            return ctx.fail("歌单封面不能为空")
        }
        try {
            const params = {
                cover: cover.id,
                title,
                description,
                sort,
                isHot,
                enabled,
                createUserId: ctx.user.userId
            }
            await playlistModel.withTransaction(async (model) => {
                const result = id ? await model.updateOne({ id }, params) : await model.insertOne(params)
                if (result.insertId) {
                    await playlistStatsModel.insertOne({ playlistId: result.insertId, favoriteTotal: 0, playTotal: 0, clickTotal: 0 })
                }
                return result
            })
            ctx.success(null, id ? "更新成功" : "添加成功")
        } catch (error) {
            if (error.code == "ER_DUP_ENTRY") return ctx.fail("歌单已存在")
            ctx.fail(error.message)
        }
    },
}


