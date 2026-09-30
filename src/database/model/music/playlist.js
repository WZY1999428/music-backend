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

export const playlistSongModel = await odm.model('music_playlist_song', playlistSongSchema);
export const playlistModel = await odm.model('music_playlist', playlistSchema);
