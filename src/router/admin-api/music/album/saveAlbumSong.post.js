import { albumSongModel ,albumModel } from "@/database/model/music/album.js";

export default {
    action: '保存专辑歌曲',
    logType: 'SAVE_ALBUM_SONG',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { albumId, songIds } = ctx.request.body;
        $validate(albumId, "专辑id不能为空")
        if (!songIds || !songIds.length) {
            return ctx.fail("歌曲id不能为空")
        }
        const album = await albumModel.findOne({ id: albumId })
        if (!album) return ctx.fail("专辑不存在")

        // 插入新的关联
        const albumSongs = songIds.map(songId => ({
            albumId,
            songId
        }))
        await albumSongModel.insertMany(albumSongs, {
            ignore: true
        })

        ctx.success("添加成功");
    },
}