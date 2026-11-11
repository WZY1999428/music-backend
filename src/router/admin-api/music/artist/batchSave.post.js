import artistModel from "@/database/model/music/artist.js";
export default {
    action: '批量保存歌手',
    logType: 'SAVE_MUSIC_ARTIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        let { batchs = [], enabled = 1 } = ctx.request.body;

        if (!Array.isArray(batchs)) {
            return ctx.fail("批量数据格式错误")
        }

        for (const batch of batchs) {
            $validate(batch.name, '歌手名称不能为空')
        }
        const createUserId = ctx.user.userId;
        try {
            await artistModel.insertMany(batchs.map(batch => {
                let avatar = 10000;
                let cover = 10000
                if (batch.avatar && batch.avatar.id) {
                    avatar = batch.avatar.id
                }
                if (batch.cover && batch.cover.id) {
                    cover = batch.cover.id
                }
                return {
                    name: batch.name,
                    avatar: avatar,
                    alias: batch.alias || "",
                    cover: cover,
                    sort: batch.sort,
                    gender: batch.gender,
                    area: batch.area,
                    enabled: batch.enabled,
                    createUserId: createUserId,
                    description: batch.description,
                    isHot: batch.isHot
                }
            }), { ignore: true })
            ctx.success("保存成功")
        } catch (error) {
            if (error.code == "ER_DUP_ENTRY") return ctx.fail("歌手已存在")
            ctx.fail(error.message)
        }
    },
}