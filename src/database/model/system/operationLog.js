import { odm, BaseSchema } from "@/database"
import { DataType } from "mysql-dsl/schema"

const operationLogSchema = new BaseSchema({
    title: { type: DataType.VarChar, length: 255, nullable: false },
    userId: { type: DataType.BigInt, default: 0 },
    username: { type: DataType.VarChar, length: 30, nullable: false },
    method: { type: DataType.VarChar, length: 30, nullable: false },
    path: { type: DataType.VarChar, length: 255, nullable: false },
    action: { type: DataType.VarChar, length: 255, nullable: false },
});
const operationLogModel = odm.model('operation_logs', operationLogSchema);
export default operationLogModel;
