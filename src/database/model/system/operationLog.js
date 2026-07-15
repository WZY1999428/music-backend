const { odm } = require("@/database")
const { Schema, DataType } = require("mysql-odm/schema");

const operationLogSchema = new Schema({
    id: { type: DataType.BigInt, primaryKey: true, autoIncrement: { start: 10000, enabled: true } },
    title: { type: DataType.VarChar, length: 255, nullable: false },
    userId: { type: DataType.BigInt, default: 0 },
    username: { type: DataType.VarChar, length: 30, nullable: false },
    method: { type: DataType.VarChar, length: 30, nullable: false },
    path: { type: DataType.VarChar, length: 255, nullable: false },
    action: { type: DataType.VarChar, length: 255, nullable: false },
    createdAt: { type: DataType.Date, default: 'CURRENT_TIMESTAMP' },
});
const operationLogModel = odm.model('operation_logs', operationLogSchema);
module.exports = operationLogModel;
