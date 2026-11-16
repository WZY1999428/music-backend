import artistModel, { artistFavoriteModel, artistAliasModel } from "@/database/model/music/artist.js";
import { songArtistModel } from "@/database/model/music/song.js";
export default {
    action: '删除歌手',
    logType: 'DELETE_MUSIC_ARTIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "id不能为空")
        await artistModel.withTransaction(async (model) => {
            const result = await model.deleteOne({ id })
            await artistFavoriteModel.deleteMany({ artistId: id })
            await artistAliasModel.deleteMany({ artistId: id })
            await songArtistModel.deleteMany({ artistId: id })
            if (result.affectedRows === 0) {
                ctx.fail("歌手不存在");
                return;
            }
        })
        ctx.success(null, "删除成功");
    },
}