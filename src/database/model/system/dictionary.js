import { odm } from "@/database/index.js"
import { convertIntFieldsToBoolean, convertBooleanFieldsToInt } from "@/database/utils.js"
const { Schema, DataType } = await import("mysql-odm/schema");
const hooks = {
    beforeInsert(data) {
        convertIntFieldsToBoolean(data, ['enabled'])
    },
    beforeUpdate(_, data) {
        convertIntFieldsToBoolean(data, ['enabled'])
    },
    afterFind(data) {
        if (data) convertBooleanFieldsToInt(data, ['enabled'])
    }
};

const dictTypeSchema = new Schema({
    id: { type: DataType.BigInt, primaryKey: true, autoIncrement: { start: 10000, enabled: true } },
    title: { type: DataType.VarChar, length: 50, nullable: false },
    remark: { type: DataType.VarChar, length: 255, nullable: false },
    code: { type: DataType.VarChar, nullable: false },
    sort: { type: DataType.Int, default: 1 },
    enabled: { type: DataType.Int, default: 1 },
    createdAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
    updatedAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
}, hooks);


const dictItemSchema = new Schema({
    id: { type: DataType.BigInt, primaryKey: true, autoIncrement: { start: 10000, enabled: true } },
    parentId: { type: DataType.BigInt, nullable: false },
    title: { type: DataType.VarChar, length: 50, nullable: false },
    value: { type: DataType.VarChar, length: 50, nullable: false },
    sort: { type: DataType.Int, default: 1 },
    enabled: { type: DataType.Int, default: 1 },
    createdAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
    updatedAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
}, hooks);



export const dictItemModel = odm.model('dict_items', dictItemSchema);
export const dictTypeModel = odm.model('dict_types', dictTypeSchema);
