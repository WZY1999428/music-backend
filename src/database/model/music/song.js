import { odm, BaseSchema } from "@/database/index.js"
import { DataType } from "mysql-dsl/schema"

const songSchema = new BaseSchema({
    title: { type: DataType.VarChar, length: 255, nullable: false }, // 歌名（如：晴天）
    mvUrl: { type: DataType.VarChar, length: 255, nullable: true }, // 歌名（如：晴天）
    cover: { type: DataType.Int, nullable: true }, // 封面图 文件id
    lang: { type: DataType.VarChar, length: 20, nullable: true }, // 语言
    playTotal: { type: DataType.BigInt, nullable: false, default: 0 }, // 播放次数
    clickTotal: { type: DataType.BigInt, nullable: false, default: 0 }, // 点击次数
    favoriteTotal: { type: DataType.BigInt, nullable: false, default: 0 }, // 收藏次数
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


const songLyricSchema = new BaseSchema({
    songId: { type: DataType.Int, nullable: false },   // 歌曲id
    title: { type: DataType.VarChar, length: 255, nullable: false }, // 歌词标题
    lang: { type: DataType.VarChar, length: 20, nullable: false },   // 语言
    sort: { type: DataType.Int, nullable: false },   // 排序
    content: { type: DataType.Text, nullable: false },   // 歌词内容
    enabled: { type: DataType.Int, nullable: true, default: 0 },   // 是否启用
    format: { type: DataType.VarChar, length: 20, nullable: false },   // 格式 LRC TTML Karaoke
});

const favoriteSchema = new BaseSchema({
    songId: { type: DataType.Int, nullable: false },   // 歌曲id
    userId: { type: DataType.BigInt, nullable: false },    // 用户id
});

const songTypeSchema = new BaseSchema({
    songId: { type: DataType.Int, nullable: false },   // 歌曲id
    type: { type: DataType.VarChar, length: 20, nullable: false },    // 类型
});



export const songModel = await odm.model('music_song', songSchema);
export const songArtistModel = await odm.model('music_song_artist', songArtistSchema);
export const songAudioModel = await odm.model('music_song_audio', songAudioSchema);
export const songLyricModel = await odm.model('music_song_lyric', songLyricSchema);
export const favoriteSongModel = await odm.model('music_song_favorite', favoriteSchema);
export const songTypeModel = await odm.model('music_song_type', songTypeSchema);

