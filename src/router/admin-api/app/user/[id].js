import userModel from "@/database/model/app/user/user.js"
import userFavoriteModel from "@/database/model/app/user/userFavorite.js"
import userPlayHistoryModel from "@/database/model/app/user/userPlayHistory.js"
import userPlaylistModel from "@/database/model/app/user/userPlaylist.js"
import { songModel } from "@/database/model/music/song.js"
export default {
    action: '获取用户详情',
    logType: 'GET_APP_USER_DETAIL',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        $validate(id, "用户ID不能为空");
        //  (song: 歌曲, album: 专辑, artist: 歌手, playlist: 歌单)
        const [user, favoriteList, playHistoryList, playlistList] = await Promise.all([
            userModel.findOne({ id }),
            findFavoriteList(id),  // 收藏列表
            findUserPlayHistory(id),  // 播放历史
            findUserPlaylist(id)  // 播放列表
        ]);

        if (!user) {
            return ctx.fail("用户不存在");
        }
        const { password, ...userWithoutPassword } = user;
        ctx.success({
            ...userWithoutPassword,
            albumFavoriteList: favoriteList.filter(item => item.targetType === 'album'),
            artistFavoriteList: favoriteList.filter(item => item.targetType === 'artist'),
            playlistFavoriteList: favoriteList.filter(item => item.targetType === 'playlist'),
            playHistoryList,
            playlistList
        });
    }
}

function findFavoriteList(id) {
    const fields = userPlaylistModel.qualifyFields(['id', 'userId', 'title', 'cover', 'description', 'isPublic', 'playCount', 'sort', 'enabled'])
    fields.push(userFavoriteModel.qualifyField("targetType"))
    return userFavoriteModel.aggregate({
        query: { [fields[1]]: id },
        fields,
        joins: [{
            table: userPlaylistModel.table,
            type: "left",
            as: userPlaylistModel.table,
            on: { [`${userPlaylistModel.table}.id`]: `${userFavoriteModel.table}.targetId` },
        }],
    })
}


function findUserPlayHistory(id) {
    const fields = songModel.qualifyFields(['id', 'title', 'mvUrl', 'cover', 'createUserId', 'enabled', 'publishDate'])
    const songId = songModel.qualifyField("id");
    fields.push(songId)
    return userPlayHistoryModel.aggregate({
        query: { [userPlayHistoryModel.qualifyField("userId")]: id },
        fields,
        joins: [{
            table: songModel.table,
            type: "left",
            as: songModel.table,
            on: { [songId]: `${userPlayHistoryModel.table}.songId` },
        }],
    })
}

function findUserPlaylist(id) {
    const fields = songModel.qualifyFields(['id', 'title', 'mvUrl', 'cover', 'createUserId', 'enabled', 'publishDate'])
    return userPlaylistModel.aggregate({
        query: { [userPlaylistModel.qualifyField("userId")]: id },
        fields,
        joins: [{
            table: songModel.table,
            type: "left",
            as: songModel.table,
            on: { [`${songModel.table}.id`]: `${userPlaylistModel.table}.userId` },
        }],
    })
}

