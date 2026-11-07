import { userPlaylistModel } from "@/database/model/app/user/playlist.js"
export default {
    action: '保存用户歌单',
    logType: 'SAVE_USER_PLAYLIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id, title, description, cover } = ctx.request.body;
        $validate(title, "标题不能为空")
        $validate(description, "简介不能为空")
        if (!cover || !cover.id) {
            return ctx.fail("封面不能为空")
        }
        const userId = ctx.appUser.userId
        const result = id ?
            await userPlaylistModel.updateOne({ id, createUserId: userId }, { title, description, cover: cover.id })
            : await userPlaylistModel.insertOne({ title, description, cover: cover.id, createUserId: userId })
        ctx.success(null,result.insertId ? "创建成功" : "更新成功"); 
    },
}