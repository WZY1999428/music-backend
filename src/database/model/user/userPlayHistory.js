import { odm, BaseSchema } from "@/database/index.js"
import { DataType } from "mysql-dsl/schema"

const userPlayHistorySchema = new BaseSchema({
    userId: { type: DataType.BigInt, nullable: false, uniqueGroup: ["user_song_unique"] }, // 用户ID
    songId: { type: DataType.BigInt, nullable: false, uniqueGroup: ["user_song_unique"] }, // 歌曲ID
    playCount: { type: DataType.Int, default: 1 },                                         // 播放次数
    progress: { type: DataType.Int, default: 0 },                                          // 上次播放进度（秒）
    lastPlayedAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },               // 最后播放时间
});

const userPlayHistoryModel = await odm.model('app_user_play_history', userPlayHistorySchema);

export default userPlayHistoryModel;
