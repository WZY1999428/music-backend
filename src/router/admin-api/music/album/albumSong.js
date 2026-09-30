import { albumModel, albumSongModel } from "@/database/model/music/album.js";
import { songModel, songArtistModel } from "@/database/model/music/song.js";
export default {
    action: '获取专辑歌曲',
    logType: 'GET_ALBUM_SONG',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { albumId, pageIndex = 1, pageSize = 10 } = ctx.request.query;
        $validate(albumId, "专辑id不能为空")
        const album = await albumModel.findOne({ id: albumId })
        if (!album) return ctx.fail("专辑不存在")
        const page = paginate(pageIndex, pageSize)
        const fields = songModel.qualifyFields(["id", "title", "enabled", "publishDate", "updatedAt", "enabled"]);
        const [list, total] = await Promise.all([
            albumSongModel.aggregate({
                fields: [albumSongModel.qualifyField('albumId'), ...fields],
                query: { albumId },
                joins: [
                    {
                        table: songModel.table,
                        as: songModel.table,
                        on: {
                            [albumSongModel.qualifyField('songId')]: songModel.qualifyField('id')
                        },
                    }
                ],
                ...page
            }),
            albumSongModel.count({
                query: { albumId },
            })
        ])


        ctx.success({ list, total });
    },
}