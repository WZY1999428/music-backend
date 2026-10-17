import { songModel } from "@/database/model/music/song";
export default {
    action: '获取每日推荐',
    logType: 'APP_GET_DAILY_RECOMMENDATIONS',
    enableLog: true,
    /** @type {Controller} */
    handler: async (ctx) => {
        // songModel.findMany()
        ctx.success();
    },
}