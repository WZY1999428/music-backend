import { userPlaylistModel } from "@/database/model/app/user/userPlaylist.js"
import uploadModel from "@/database/model/upload.js";

export default {
    action: '获取用户歌单详情',
    logType: 'GET_USER_PLAYLIST_DETAIL',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        $validate(id, "歌单id不能为空");
        const playlists = await userPlaylistModel.aggregate({
            fields: userPlaylistModel.qualifyFields(),
            query: {
                [userPlaylistModel.qualifyField("id")]: id,
                [userPlaylistModel.qualifyField("userId")]: ctx.appUser.userId
            },
            joins: [
                {
                    table: uploadModel.table,
                    as: "upload",
                    on: { "upload.id": userPlaylistModel.qualifyField("cover") },
                    select: [
                        {
                            type: "jsonObject",
                            alias: "cover",
                            fields: { url: "upload.url", id: "upload.id" }
                        }
                    ]
                }
            ],
            limit: 1
        })
        if (!playlists.length) {
            ctx.fail("歌单不存在");
            return;
        }
        ctx.success(playlists[0]);
    },
}