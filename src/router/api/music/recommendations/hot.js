import { songModel } from "@/database/model/music/song.js"

export default {
    action: '获取热门新歌',
    logType: 'GET_HOT_SONGS',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const hotSongList = await getSongList({
            [songModel.qualifyField('enabled')]: 1
        }, {
            offset: 0,
            limit: 50,
            sort: { [songModel.qualifyField("playTotal")]: "desc", [songModel.qualifyField("publishDate")]: "desc" }
        })

        ctx.success({
            hotSongList
        });
    },
}