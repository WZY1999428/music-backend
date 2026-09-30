import { odm, BaseSchema } from "@/database/index.js"
import { DataType } from "mysql-dsl/schema"

const albumSchema = new BaseSchema({
    title: { type: DataType.VarChar, length: 255, nullable: false }, // 专辑名（如：叶惠美）
    cover: { type: DataType.Int, nullable: true }, // 封面图 文件id
    // 1. 发行与发行信息
    releaseDate: { type: DataType.VarChar, length: 50, nullable: true }, // 发行日期（如："2003-07-31"）
    company: { type: DataType.VarChar, length: 255, nullable: true },    // 发行公司 / 唱片公司（如："杰威尔音乐"）
    // 2. 专辑类型与风格
    type: { type: DataType.VarChar, length: 50 },      //   （如：album: 录音室专辑, single: 单曲, ep: EP, live: 现场演唱会）
    genre: { type: DataType.VarChar, length: 100, nullable: true },      // 流派/风格（如："流行 / Pop"）
    createUserId: { type: DataType.BigInt, nullable: true },       // 创建人ID
    // 3. 详情描述
    description: { type: DataType.Text, nullable: true },                // 专辑介绍 / 简介
    // 4. 运营与展示控制
    sort: { type: DataType.Int },                       // 权重/排序值（数字越大越靠前）
    isHot: { type: DataType.Int, default: 0 },                           // 是否热门/推荐专辑 (0: 否, 1: 是)
    enabled: { type: DataType.Int, default: 1 },                         // 状态 (0: 隐藏/下架, 1: 正常展示)
});



const albumArtistSchema = new BaseSchema({
    albumId: { type: DataType.BigInt, nullable: false, groupUnique: ["albumId_artistId"] },   // 专辑id
    artistId: { type: DataType.BigInt, nullable: false, groupUnique: ["albumId_artistId"] },    // 演唱者 id
});


const albumSongSchema = new BaseSchema({
    albumId: { type: DataType.BigInt, nullable: false, groupUnique: ["albumId_songId"] }, // 专辑ID
    songId: { type: DataType.BigInt, nullable: false, groupUnique: ["albumId_songId"] }, // 歌曲ID
    sort: { type: DataType.Int, default: 0 }, // 排序
});

export const albumModel = await odm.model('music_album', albumSchema);
export const albumArtistModel = await odm.model('music_album_artist', albumArtistSchema);
export const albumSongModel = await odm.model('music_album_song', albumSongSchema);
