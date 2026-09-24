import { odm, BaseSchema } from "@/database/index.js"
const { DataType } = await import("mysql-dsl/schema");

const deptSchema = new BaseSchema({
    parentId: { type: DataType.BigInt, nullable: true, default: 0 },         // 父级部门ID（0或null表示顶级）
    deptName: { type: DataType.VarChar, length: 100, nullable: false, unique: true },      // 部门名称
    sort: { type: DataType.Int, default: 0 },                           // 显示排序（越小越靠前）
    leaderId: { type: DataType.BigInt, nullable: true },                     // 部门负责人 User ID
    phone: { type: DataType.VarChar, length: 20, nullable: true },           // 部门联系电话
    email: { type: DataType.VarChar, length: 100, nullable: true },          // 部门邮箱
    enabled: { type: DataType.Int, default: 1 },                              // 状态：1-正常，0-停用
    remark: { type: DataType.VarChar, length: 500, nullable: true },         // 备注
});
const deptModel = await odm.model('system_dept', deptSchema);
export default deptModel;
