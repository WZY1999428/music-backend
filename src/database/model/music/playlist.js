import { odm, BaseSchema } from "@/database/index.js"
import { DataType } from "mysql-dsl/schema"

const playlistSchema = new BaseSchema({
    title: { type: DataType.VarChar, length: 255, nullable: false },
    description: { type: DataType.VarChar, length: 500, default: '' },
    coverFileId: { type: DataType.BigInt, nullable: true }
});

const playlistSongSchema = new BaseSchema({
    playlistId: { type: DataType.Int, nullable: false },  // 歌单ID
    songId: { type: DataType.Int, nullable: false },  // 歌曲ID
});

export const playlistSongModel = await odm.model('music_playlist_song', playlistSongSchema);


export default playlistModel;  