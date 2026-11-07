import { odm, BaseSchema } from "@/database/index.js"
import { DataType } from "mysql-dsl/schema"

const playlistSchema = new BaseSchema({
    title: { type: DataType.VarChar, length: 255, nullable: false, uniqueGroup: ["user_playlist"] },
    cover: { type: DataType.BigInt, nullable: false },
    description: { type: DataType.VarChar, length: 500 },
    createUserId: { type: DataType.BigInt, nullable: false, uniqueGroup: ["user_playlist"] },
    enabled: { type: DataType.BigInt, default: 1 },
});
const playlistSongSchema = new BaseSchema({
    playlistId: { type: DataType.Int, nullable: false, uniqueGroup: ["playlist_song"] },  // 歌单ID
    songId: { type: DataType.Int, nullable: false, uniqueGroup: ["playlist_song"] },  // 歌曲ID
});

export const userPlaylistSongModel = await odm.model('app_user_playlist_song', playlistSongSchema);
export const userPlaylistModel = await odm.model('app_user_playlist', playlistSchema);

