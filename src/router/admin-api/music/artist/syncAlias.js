import artistModel, { artistAliasModel } from "@/database/model/music/artist.js";
export default {
    action: '同步歌手别名',
    logType: 'SYNC_MUSIC_ARTIST_ALIAS',
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const artists = await artistModel.findMany({})
        await artistAliasModel.withTransaction(async (model) => {
            for (const artist of artists) {
                const alias = artist.alias
                    ?.split(/[，,|]/)
                    .map(item => item.trim())
                    .filter(Boolean) || [];
                if (alias.length) {
                    // 保存别名
                    await model.insertMany(alias.map(alias => ({ artistId: artist.id, alias }))).catch(() => { })
                }
            }
        })

        ctx.success(null, '同步成功')
    },
}