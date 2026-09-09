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
        return data;
    }
};

const dictTypeSchema = new Schema({
    id: { type: DataType.BigInt, primaryKey: true, autoIncrement: { start: 10000, enabled: true } },
    title: { type: DataType.VarChar, length: 50, nullable: false, unique: true },
    remark: { type: DataType.VarChar, length: 255, nullable: false },
    code: { type: DataType.VarChar, length: 255, nullable: false, unique: true },
    sort: { type: DataType.Int, default: 1 },
    enabled: { type: DataType.Int, default: 1 },
    createdAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
    updatedAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
}, hooks);


const dictItemSchema = new Schema({
    id: { type: DataType.BigInt, primaryKey: true, autoIncrement: { start: 10000, enabled: true } },
    parentId: { type: DataType.BigInt, nullable: false, uniqueGroup: ["itemValue"] },
    title: { type: DataType.VarChar, length: 50, nullable: false, uniqueGroup: ["itemValue"] },
    value: { type: DataType.VarChar, length: 50, nullable: false, uniqueGroup: ["itemValue"] },
    //extData 扩展字段，应对各种临时/备用需求
    extData: { type: DataType.VarChar, length: 500, nullable: true },
    sort: { type: DataType.Int, default: 1 },
    enabled: { type: DataType.Int, default: 1 },
    createdAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
    updatedAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
}, hooks);



export const dictItemModel = await odm.model('dict_items', dictItemSchema);

export const dictTypeModel = await odm.model('dict_types', dictTypeSchema);
