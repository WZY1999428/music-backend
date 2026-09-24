import { odm, BaseSchema } from "@/database/index.js"
const { DataType } = await import("mysql-dsl/schema");

const agreementsSchema = new BaseSchema({
    title: { type: DataType.VarChar, length: 100, nullable: false },         // 协议标题
    code: { type: DataType.VarChar, length: 100, nullable: false, unique: true },         // 协议编码
    createUserId: { type: DataType.BigInt, nullable: false },                    // 创建人ID
    content: { type: DataType.MediumText, nullable: false },         // 协议内容
    enabled: { type: DataType.Int, default: 1 },                              // 状态：1-正常，0-停用
});
const agreementsModel = await odm.model('content_mgmt_agreements', agreementsSchema);
export default agreementsModel;
