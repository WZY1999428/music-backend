import { odm, BaseSchema } from "@/database/index.js"
import { DataType } from "mysql-dsl/schema"

const playlistSchema = new BaseSchema({
    title: { type: DataType.VarChar, length: 255, nullable: false },
    cover: { type: DataType.BigInt, nullable: false },
    isHot: { type: DataType.Int, default: 0 },
    sort: { type: DataType.Int, default: 0 },
    createUserId: { type: DataType.BigInt, nullable: false },
    enabled: { type: DataType.BigInt, default: 1 },
    description: { type: DataType.VarChar, length: 500 },
});

const playlistSongSchema = new BaseSchema({
    playlistId: { type: DataType.Int, nullable: false },  // 歌单ID
    songId: { type: DataType.Int, nullable: false },  // 歌曲ID
});

const playlistStatsSchema = new BaseSchema({
    playlistId: { type: DataType.Int, nullable: false, unique: true },  // 歌单ID
    favoriteTotal: { type: DataType.BigInt, nullable: false, default: 0 },  // 收藏总数
    playTotal: { type: DataType.BigInt, nullable: false, default: 0 },  // 播放总数
    clickTotal: { type: DataType.BigInt, nullable: false, default: 0 },  // 点击总数
});

const favoriteSchema = new BaseSchema({
    playlistId: { type: DataType.Int, nullable: false, uniqueGroup: ["favorite_playlist"] },  // 歌单ID
    userId: { type: DataType.BigInt, nullable: false, uniqueGroup: ["favorite_playlist"] },  // 用户ID
});

export const playlistSongModel = await odm.model('music_playlist_song', playlistSongSchema);
export const playlistModel = await odm.model('music_playlist', playlistSchema);
export const playlistStatsModel = await odm.model('music_playlist_stats', playlistStatsSchema);
export const favoritePlaylistModel = await odm.model('music_playlist_favorite', favoriteSchema);
