import valkey from "@/utils/valkey.js";
import { songModel } from "@/database/model/music/song.js";
const DAILY_RECOMMENDATIONS_KEY = 'daily_recommendations';

export default {
    action: '获取每日推荐',
    logType: 'GET_DAILY_RECOMMENDATIONS',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        try {
            let songList = [];
            if (ctx.appUser) {
                const dailyRecommendations = await valkey.getObject(`${ctx.appUser.userId}_${DAILY_RECOMMENDATIONS_KEY}`);
                if (dailyRecommendations && dailyRecommendations.length > 0) {
                    songList = await getSongList({ [songModel.qualifyField('id')]: { $in: dailyRecommendations } }, { userId: ctx.appUser?.userId, })
                    ctx.success(songList);
                    return;
                }
            }

            const dailyRecommendations = await valkey.getObject(DAILY_RECOMMENDATIONS_KEY);
            if (dailyRecommendations && dailyRecommendations.length > 0) {
                songList = await getSongList({ [songModel.qualifyField('id')]: { $in: dailyRecommendations } }, { userId: ctx.appUser?.userId, })
            } else {
                songList = await getDailyRecommendations(ctx.appUser?.userId)
            }
            ctx.success(songList);
        } catch (error) {
            console.log(error);
        }
    },
}

valkey.onExpired(async (_pattern, _channel, key) => {
    if (key === DAILY_RECOMMENDATIONS_KEY) {
        getDailyRecommendations()
    }
});


async function getDailyRecommendations(userId) {
    const sort=Object.fromEntries(songModel.qualifyFields(['playTotal', 'clickTotal', 'favoriteTotal']).map(field => [field, 'desc']))
    const host = await getSongList({}, {
        sort: sort,
        userId: userId,
        offset: 0,
        limit: 5
    })
    const ids = host.map(item => item.id)
    const newSong = await getSongList({
        [songModel.qualifyField('id')]: { $nin: ids }
    }, {
        sort:sort,
        userId:userId,
        offset: 0,
        limit: 5
    })

    ids.push(...newSong.map(item => item.id))
    const randomSong = await getSongList({
        [songModel.qualifyField('id')]: { $nin: ids }
    }, {
        sort: { $random: true },
        userId: userId,
        offset: 0,
        limit: 5
    })

    ids.push(...randomSong.map(item => item.id))


    await valkey.setObject(DAILY_RECOMMENDATIONS_KEY, ids, "EX", getSecondsLeftToday())

    return [...host, ...newSong, ...randomSong]
}


