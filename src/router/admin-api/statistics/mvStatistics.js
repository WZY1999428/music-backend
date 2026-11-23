import { songModel } from "@/database/model/music/song.js"
export default {
    action: '获取音乐mv统计',
    logType: 'MV_STATISTICS',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const [mvTotal, songTotal] = await Promise.all([
            songModel.count({
                query: { mvUrl: { $ne: null } }
            }),
            songModel.count({})
        ])
        ctx.success([
            { name: '有 MV', value: mvTotal },
            { name: '无 MV', value: songTotal - mvTotal },
        ]);
    },
}

