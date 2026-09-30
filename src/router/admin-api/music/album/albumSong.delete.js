import { albumModel, albumSongModel } from "@/database/model/music/album.js";

export default {
    action: '删除专辑歌曲',
    logType: 'DELETE_ALBUM_SONG',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { albumId, songIds } = ctx.request.query;

        $validate(albumId, "专辑id不能为空")
        if (!songIds || !songIds.length) {
            return ctx.fail("歌曲id不能为空")
        }

        console.log(songIds);


        const album = await albumModel.findOne({ id: albumId })
        if (!album) return ctx.fail("专辑不存在")
        await albumSongModel.deleteMany({ albumId, songId: { $in: songIds } })
        ctx.success("删除成功");
    },
}