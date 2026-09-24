import artistModel from "@/database/model/music/artist.js";
export default {
    action: '保存歌手',
    logType: 'SAVE_MUSIC_ARTIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id, name, realName, avatar, cover,sort, gender, area, isHot, description, enabled = 1 } = ctx.request.body;
        const createUserId = ctx.user.userId;
        $validate(name, "歌手名称不能为空")
        $validate(realName, "歌手真实姓名不能为空")
        $validate(gender, "歌手性别不能为空")

        if (!avatar || !avatar.id) {
            return ctx.fail("歌手头像不能为空")
        }
        if (!cover || !cover.id) {
            return ctx.fail("歌手封面不能为空")
        }

        try {
            const params = { name, realName, avatar: avatar.id, cover: cover.id, sort, gender, area, enabled, createUserId, description, isHot }
            id ? await artistModel.updateOne({ id }, params) : await artistModel.insertOne(params)
            ctx.success(null, id ? "更新成功" : "添加成功")
        } catch (error) {
            if (error.code == "ER_DUP_ENTRY") return ctx.fail("协议编号已存在")
            ctx.fail(error.message)
        }
    },
}