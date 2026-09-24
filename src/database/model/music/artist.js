import { odm, BaseSchema } from "@/database/index.js"
import { DataType } from "mysql-dsl/schema"

const artistSchema = new BaseSchema({
    // 1. 基础信息
    name: { type: DataType.VarChar, length: 100, nullable: false, unique: true },        // 歌手/乐队名称 (如: 周杰伦 / Mayday)
    realName: { type: DataType.VarChar, length: 100, nullable: true },   // 真实姓名 (如: 周杰伦 / 蔡依林)
    avatar: { type: DataType.BigInt, nullable: false },      // 歌手头像/封面图片地址
    cover: { type: DataType.BigInt, nullable: true },       // 歌手主页大背景图 (可选)
    createUserId: { type: DataType.BigInt, nullable: true },       // 歌手主页大背景图 (可选)
    // 2. 检索与分类
    pinyin: { type: DataType.VarChar, length: 100, nullable: true, index: true },      // 拼音简写 (用于首字母检索，如: zjl)
    firstLetter: { type: DataType.VarChar, length: 1, nullable: true },  // 姓氏首字母 (用于 A-Z 歌手筛选，如: Z)
    gender: { type: DataType.Char, length: 100 },                           // 性别/类型 (0: 未知, 1: 男, 2: 女, 3: 组合/乐队)
    area: { type: DataType.VarChar, length: 50, nullable: true },         // 地区 (如: 华语, 欧美, 日本, 韩国)
    // 3. 详情与介绍
    description: { type: DataType.Text, nullable: true },                 // 歌手简介 / 履历
    // 4. 统计与展示控制 (用于前台排序/推荐)
    sort: { type: DataType.Int, default: 0 },                       // 权重/自定义排序 (值越大越靠前)
    isHot: { type: DataType.Int, default: 0 },                           // 是否热门歌手 (0: 否, 1: 是，用于首页推荐)
    // 5. 状态管理
    enabled: { type: DataType.Int, default: 1 },                          // 状态 (0: 隐藏/下架, 1: 正常展示)
});

const artistModel = await odm.model('music_artist', artistSchema);


export default artistModel;  