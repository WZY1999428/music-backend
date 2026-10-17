import valkey from "@/utils/valkey";
import { songModel, songArtistModel } from "@/database/model/music/song.js";
import artistModel from "@/database/model/music/artist";
import uploadModel from "@/database/model/upload.js";
const DAILY_RECOMMENDATIONS_KEY = 'daily_recommendations';
await valkey.del(DAILY_RECOMMENDATIONS_KEY);
export default {
    action: '获取每日推荐',
    logType: 'GET_DAILY_RECOMMENDATIONS',
    /** @type {Controller} */
    handler: async (ctx) => {
        let songList = [];
        if (ctx.appUser) {
            const dailyRecommendations = await valkey.getObject(`${ctx.appUser.userId}_${DAILY_RECOMMENDATIONS_KEY}`);
            if (dailyRecommendations && dailyRecommendations.length > 0) {
                songList = await aggregate({ [songModel.qualifyField('id')]: { $in: dailyRecommendations } })
                ctx.success(songList);
                return;
            }
        }

        const dailyRecommendations = await valkey.getObject(DAILY_RECOMMENDATIONS_KEY);

        if (dailyRecommendations && dailyRecommendations.length > 0) {
            songList = await aggregate({ [songModel.qualifyField('id')]: { $in: dailyRecommendations } })
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
    const host = await aggregate({}, {
        playTotal: 'desc',
        clickTotal: 'desc',
        favoriteTotal: 'desc'
    })
    const ids = host.map(item => item.id)
    const newSong = await aggregate({
        [songModel.qualifyField('id')]: { $nin: ids }
    }, {
        playTotal: 'desc',
        clickTotal: 'desc',
        favoriteTotal: 'desc'
    })

    ids.push(...newSong.map(item => item.id))
    const randomSong = await aggregate({
        [songModel.qualifyField('id')]: { $nin: ids }
    }, {
        $random: true
    })

    ids.push(...randomSong.map(item => item.id))

    await valkey.setObject(DAILY_RECOMMENDATIONS_KEY, ids, "EX", getSecondsLeftToday())

    return [...host, ...newSong, ...randomSong]
}



function aggregate(query, sort = {}) {
    return songModel.aggregate({
        fields: songModel.qualifyFields(["id", "title", "lang"]),
        query: {
            ...query,
            [songModel.qualifyField("enabled")]: 1
        },
        joins: [
            {
                table: uploadModel.table,
                as: "upload",
                type: "left",
                on: {
                    "upload.id": songModel.qualifyField("cover")
                },
                select: [
                    {
                        type: "raw",
                        fields: { cover: "upload.url" }
                    }
                ]
            },
            {
                table: songArtistModel.table,
                as: "songArtist",
                type: "left",
                on: {
                    "songArtist.songId": songModel.qualifyField("id")
                }
            },
            {
                table: artistModel.table,
                as: "artist",
                type: "left",
                on: {
                    "artist.id": "songArtist.artistId"
                },
                select: [
                    {
                        type: "jsonArray",
                        alias: "artists",
                        fields: {
                            artistId: "artist.id",
                            artistName: "artist.name"
                        }
                    }
                ]
            }
        ],
        group: [songModel.qualifyField("id")],
        sort,
        limit: 5
    });
}



