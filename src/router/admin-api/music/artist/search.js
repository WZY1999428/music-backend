import artistModel, { artistAliasModel } from "@/database/model/music/artist.js";
export default {
    action: '搜索歌手',
    logType: 'SEARCH_MUSIC_ARTIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { keyword } = ctx.request.query;
        const query = {};
        if (keyword) {
            query.$or = [
                { name: { $like: `${keyword.trim()}%` } },
                { "artistAlias.alias": { $like: `${keyword.trim()}%` } }
            ]
        }
        const page = paginate(1, 20);
        const result = await artistModel.aggregate({
            query,
            fields: artistModel.qualifyFields(["name", "id"]),
            joins: [
                {
                    table: artistAliasModel.table,
                    as: "artistAlias",
                    type: "left",
                    on: { "artistAlias.artistId": artistModel.qualifyField("id") }
                }
            ],
            group: [artistModel.qualifyField("id")],
            ...page,
        });
        ctx.success(result);
    },
}