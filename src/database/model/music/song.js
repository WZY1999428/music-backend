import { odm, BaseSchema } from "@/database/index.js"
import { DataType } from "mysql-dsl/schema"

const songSchema = new BaseSchema({
    title: { type: DataType.VarChar, length: 255, nullable: false }, // 歌名（如：晴天）
    cover: { type: DataType.Int, nullable: true }, // 封面图 文件id
    createUserId: { type: DataType.BigInt, nullable: true }, // 创建人
    enabled: { type: DataType.TinyInt, nullable: false, default: 1 }, // 是否启用
    publishDate: { type: DataType.DateTime, nullable: false }, // 发布日期
});

const songArtistSchema = new BaseSchema({
    songId: { type: DataType.Int, nullable: false },   // 歌曲id
    artistId: { type: DataType.Int, nullable: false },    // 演唱者 id
});


const songAudioSchema = new BaseSchema({
    songId: { type: DataType.Int, nullable: false },   // 歌曲id
    fileId: { type: DataType.Int, nullable: false },    // 文件id
    duration: { type: DataType.Int, nullable: false }, // 时长（秒）
    format: { type: DataType.VarChar, length: 20, nullable: false },   // 格式
    quality: { type: DataType.VarChar, length: 20, nullable: false },  // 质量
    bitrate: { type: DataType.Int, nullable: true },   // 比特率
    sampleRate: { type: DataType.Int, nullable: true },   // 采样率
    bitDepth: { type: DataType.Int, nullable: true }   // 位深度
});


export const songModel = await odm.model('music_song', songSchema);
export const songArtistModel = await odm.model('music_song_artist', songArtistSchema);
export const songAudioModel = await odm.model('music_song_audio', songAudioSchema);
