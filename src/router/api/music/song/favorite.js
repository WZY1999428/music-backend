import { favoriteSongModel, songModel } from "@/database/model/music/song.js"
import { getSongList } from "@/utils/getSongList.js"

export default {
    action: '获取收藏歌曲',
    logType: 'GET_FAVORITE_SONGS',
    enableLog: false,
    auth: true,
    /** @type {Controller} */
    handler: async (ctx) => {
        const userId = ctx.appUser.userId

        const result = await getSongList({}, {
            userId,
            joins: [{
                table: favoriteSongModel.table,
                as: "favoriteSong",
                on: { [songModel.qualifyField("id")]: "favoriteSong.songId", "favoriteSong.userId": { $eq: userId } }
            }]
        })

        ctx.success(result)
    }
}