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
        let songList = [];
        if (ctx.appUser) {
            const dailyRecommendations = await valkey.getObject(`${ctx.appUser.userId}_${DAILY_RECOMMENDATIONS_KEY}`);
            if (dailyRecommendations && dailyRecommendations.length > 0) {
                songList = await getSongList({ [songModel.qualifyField('id')]: { $in: dailyRecommendations } })
                ctx.success(songList);
                return;
            }
        }

        const dailyRecommendations = await valkey.getObject(DAILY_RECOMMENDATIONS_KEY);
        if (dailyRecommendations && dailyRecommendations.length > 0) {
            songList = await getSongList({ [songModel.qualifyField('id')]: { $in: dailyRecommendations } })
        } else {
            songList = await getDailyRecommendations()
        }
        ctx.success(songList);
    },
}

valkey.onExpired(async (_pattern, _channel, key) => {
    if (key === DAILY_RECOMMENDATIONS_KEY) {
        getDailyRecommendations()
    }
});


async function getDailyRecommendations() {
    const host = await getSongList({}, {
        sort: {
            playTotal: 'desc',
            clickTotal: 'desc',
            favoriteTotal: 'desc'
        },
        offset: 0,
        limit: 5
    })
    const ids = host.map(item => item.id)
    const newSong = await getSongList({
        [songModel.qualifyField('id')]: { $nin: ids }
    }, {
        sort: {
            playTotal: 'desc',
            clickTotal: 'desc',
            favoriteTotal: 'desc'
        },
        offset: 0,
        limit: 5
    })

    ids.push(...newSong.map(item => item.id))
    const randomSong = await getSongList({
        [songModel.qualifyField('id')]: { $nin: ids }
    }, {
        sort: { $random: true },
        offset: 0,
        limit: 5
    })

    ids.push(...randomSong.map(item => item.id))


    await valkey.setObject(DAILY_RECOMMENDATIONS_KEY, ids, "EX", getSecondsLeftToday())

    return [...host, ...newSong, ...randomSong]
}


