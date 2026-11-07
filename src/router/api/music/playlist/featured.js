
import { songLangModel, songModel, songTypeModel } from '@/database/model/music/song.js';
export default {
    action: '根据歌单类型获取音乐',
    logType: 'GET_PLAYLIST_FEATURED',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { category } = ctx.request.query;
        //  获取华语精选
        const songSortFields = songModel.qualifyFields(["playTotal", "clickTotal", "favoriteTotal"])
        const songIdField = songModel.qualifyField("id");
        if (category === "chinese") {
            const songIds = await songModel.aggregate({
                fields: [songModel.qualifyField("id")],
                query: {
                    "songLang.lang": "zh-CN"
                },
                joins: [
                    {
                        table: songLangModel.table,
                        as: "songLang",
                        on: {
                            [songModel.qualifyField("id")]: "songLang.songId"
                        }
                    }
                ],
                sort: Object.fromEntries(songSortFields.map(field => [field, "desc"])),
                offset: 0,
                limit: 50
            })

            if (!songIds.length) {
                return ctx.success([])
            }
            const result = await getSongList({ [songIdField]: { $in: songIds.map(i => i.id) } }, { userId: ctx.appUser?.userId, })
            ctx.success(result);
        } else if (category === "indie") {
            const result = await getSongList({}, {
                sort: Object.fromEntries([songSortFields].map(field => [field, "asc"])),
                userId: ctx.appUser?.userId,
                offset: 0,
                limit: 50
            })
            ctx.success(result);
        } else if (category === "lightMusic") {
            const songIds = await songTypeModel.aggregate({
                fields: [songTypeModel.qualifyField("songId")],
                query: {
                    type: "light-music"
                },
                offset: 0,
                limit: 50
            })
            if (!songIds.length) {
                return ctx.success([])
            }
            const result = await getSongList({ [songIdField]: { $in: songIds.map(i => i.songId) } }, { userId: ctx.appUser?.userId, })
            
            ctx.success(result);
        } else {
            ctx.success([])
        }
    },
}