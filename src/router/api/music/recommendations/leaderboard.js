import valkey from "@/utils/valkey.js";
import { songModel } from "@/database/model/music/song.js";
const LEADERBOARD_KEY = 'leaderboard';

export default {
    action: '获取排行榜',
    logType: 'APP_GET_LEADERBOARD',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const leaderboard = await valkey.getObject(`${LEADERBOARD_KEY}`);
        if (leaderboard && leaderboard.length) {
            const songList = await getSongList({ [songModel.qualifyField("id")]: { $in: leaderboard } })
            return ctx.success(songList);
        }
        const newLeaderboard = await getLeaderboard();
        ctx.success(newLeaderboard);
    },
}


valkey.onExpired(async (_pattern, _channel, key) => {
    if (key === LEADERBOARD_KEY) {
        getLeaderboard()
    }
});


async function getLeaderboard() {
    const songList = await getSongList({}, {
        sort: {
            playTotal: 'desc',
            clickTotal: 'desc',
            favoriteTotal: 'desc'
        },
        offset: 0,
        limit: 50
    })

    await valkey.setObject(LEADERBOARD_KEY, songList.map(it => it.id), "EX", getSecondsLeftToday())

    return songList
}

