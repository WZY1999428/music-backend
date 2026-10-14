import { odm, BaseSchema } from "@/database/index.js"
import { DataType } from "mysql-dsl/schema"

const userPlaylistSchema = new BaseSchema({
    userId: { type: DataType.BigInt, nullable: false, index: true },   // 创建者用户ID
    title: { type: DataType.VarChar, length: 255, nullable: false },   // 歌单名称
    cover: { type: DataType.BigInt, nullable: true },                  // 封面图 文件id
    description: { type: DataType.VarChar, length: 500, nullable: true }, // 歌单简介
    isPublic: { type: DataType.Int, default: 1 },                      // 是否公开 (0: 私密, 1: 公开)
    playCount: { type: DataType.BigInt, default: 0 },                  // 播放次数
    sort: { type: DataType.Int, default: 0 },                          // 排序
    enabled: { type: DataType.Int, default: 1 },                       // 状态 (0: 删除/隐藏, 1: 正常)
});

const userPlaylistSongSchema = new BaseSchema({
    playlistId: { type: DataType.BigInt, nullable: false, uniqueGroup: ["playlist_song_unique"] }, // 用户歌单ID
    songId: { type: DataType.BigInt, nullable: false, uniqueGroup: ["playlist_song_unique"] },     // 歌曲ID
    sort: { type: DataType.Int, default: 0 },                                                      // 排序
});

export const userPlaylistSongModel = await odm.model('app_user_playlist_song', userPlaylistSongSchema);
const userPlaylistModel = await odm.model('app_user_playlist', userPlaylistSchema);

export default userPlaylistModel;
