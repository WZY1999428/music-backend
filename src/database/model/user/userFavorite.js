import { odm, BaseSchema } from "@/database/index.js"
import { DataType } from "mysql-dsl/schema"

const userFavoriteSchema = new BaseSchema({
    userId: { type: DataType.BigInt, nullable: false, uniqueGroup: ["user_favorite_unique"] },                 // 用户ID
    targetType: { type: DataType.VarChar, length: 20, nullable: false, uniqueGroup: ["user_favorite_unique"] }, // 收藏类型 (song: 歌曲, album: 专辑, artist: 歌手, playlist: 歌单)
    targetId: { type: DataType.BigInt, nullable: false, uniqueGroup: ["user_favorite_unique"] },               // 收藏对象ID
});

const userFavoriteModel = await odm.model('app_user_favorite', userFavoriteSchema);

export default userFavoriteModel;
