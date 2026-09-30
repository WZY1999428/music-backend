import { songModel, songArtistModel, songAudioModel, songLyricModel } from "@/database/model/music/song.js";
export default {
    action: '删除歌曲',
    logType: 'DELETE_MUSIC_ARTIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "id不能为空")
        const result = await songModel.deleteOne({ id })
        if (result.affectedRows === 0) {
            ctx.fail("歌曲不存在");
            return;
        }
        await songModel.withTransaction(async (model) => {
            await Promise.all([
                model.deleteOne({ id }),
                songArtistModel.deleteMany({ songId: id }),
                songAudioModel.deleteMany({ songId: id }),
                songLyricModel.deleteMany({ songId: id })
            ])
        })
        ctx.success(null, "删除成功");
    },
}