import { odm, BaseSchema } from "@/database/index.js"
const { DataType } = await import("mysql-dsl/schema");

const announceMgmtSchema = new BaseSchema({
    title: { type: DataType.VarChar, length: 100, nullable: false, unique: true },         // 公告标题
    type: { type: DataType.VarChar, length: 100, nullable: false },         // 公告类型
    sort: { type: DataType.Int, length: 100, nullable: false },
    createUserId: { type: DataType.BigInt, nullable: false },                    // 创建人ID
    startTime: { type: DataType.DateTime, nullable: false },                    // 开始时间
    endTime: { type: DataType.DateTime, nullable: false },                    // 结束时间
    content: { type: DataType.MediumText, nullable: false },         // 公告内容
    enabled: { type: DataType.Int, default: 1 },                              // 状态：1-正常，0-停用
});
const announceMgmtModel = await odm.model('content_mgmt_announce_mgmt', announceMgmtSchema);
export default announceMgmtModel;
