import userPlayHistoryModel from "@/database/model/app/user/userPlayHistory.js"
import { songModel } from "@/database/model/music/song.js"
export default {
    action: '新增用户播放记录',
    logType: 'ADD_USER_PLAY_HISTORY',
    enableLog: false,
    auth: true,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { songId } = ctx.request.body;
        const song = await songModel.findOne({ id: songId })
        if (!song) {
            ctx.fail("歌曲不存在")
            return
        }
        const userId = ctx.appUser.userId
        const histody = await userPlayHistoryModel.findOne({ userId, songId })
        if (histody) {
            await userPlayHistoryModel.updateOne({ userId, songId }, { $inc: { playCount: 1 } })
        } else {
            await userPlayHistoryModel.insertOne({ userId, songId, playCount: 1 })
        }
        ctx.success("添加成功")
    }
}