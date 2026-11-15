
import { songModel } from "@/database/model/music/song.js"
import artistModel from "@/database/model/music/artist.js"
import appUserModel from "@/database/model/app/user/user.js"

export default {
    action: '获取系统首页统计信息',
    logType: 'GET_SYSTEM_STAT_INFO',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {

        const { lastWeekEnd } = getWeekCompareRange();

        const [thisWeekTotal, totalLastWeek, thisWeekArtistTotal, totalLastWeekArtist, thisWeekUserTotal, totalLastWeekUser] = await Promise.all([
            songModel.count({}),
            songModel.count({ createdAt: { $lt: lastWeekEnd } }),
            artistModel.count({}),
            artistModel.count({ createdAt: { $lt: lastWeekEnd } }),
            appUserModel.count({}),
            appUserModel.count({ createdAt: { $lt: lastWeekEnd } }),
        ])


        ctx.success([
            {
                title: '歌曲总数量',
                value: thisWeekTotal,
                change: change(totalLastWeek, thisWeekTotal) + '%',
                isUp: thisWeekTotal >= totalLastWeek,
                color: 'blue',
                icon: "AudioFilled"
            },
            {
                title: '歌手总数量',
                value: thisWeekArtistTotal,
                change: change(totalLastWeekArtist, thisWeekArtistTotal) + '%',
                isUp: thisWeekArtistTotal >= totalLastWeekArtist,
                color: 'green',
                icon: "UserOutlined"
            }, {
                title: '用户总数量',
                value: thisWeekUserTotal,
                change: change(totalLastWeekUser, thisWeekUserTotal) + '%',
                isUp: thisWeekUserTotal >= totalLastWeekUser,
                color: 'green',
                icon: "UsergroupAddOutlined"
            }
        ])
    },
}

function change(totalLastWeek, thisWeekTotal){
    return totalLastWeek > 0
        ? ((thisWeekTotal - totalLastWeek) / totalLastWeek * 100).toFixed(1)
        : null;
}
