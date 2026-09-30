import { songLyricModel } from "@/database/model/music/song.js";
export default {
    action: '获取歌曲歌词列表',
    logType: 'GET_MUSIC_SONG_LYRICS_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { songId, pageIndex, pageSize } = ctx.request.query;
        if(!songId){
            return ctx.fail('歌曲ID不能为空');
        }
        const page = paginate(pageIndex, pageSize);
        const [list, total] = await Promise.all([
            songLyricModel.findMany({ songId }, { ...page }),
            songLyricModel.count({ songId })
        ])
        ctx.success({
            list,
            total
        });
    },
}