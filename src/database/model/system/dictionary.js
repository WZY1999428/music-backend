import { odm, BaseSchema } from "@/database/index.js"
const { DataType } = await import("mysql-dsl/schema");
const dictTypeSchema = new BaseSchema({
    title: { type: DataType.VarChar, length: 50, nullable: false, unique: true },
    remark: { type: DataType.VarChar, length: 255, nullable: true },
    code: { type: DataType.VarChar, length: 255, nullable: false, unique: true },
    sort: { type: DataType.Int, default: 1 },
    enabled: { type: DataType.Int, default: 1 },
});


const dictItemSchema = new BaseSchema({
    dictId: { type: DataType.BigInt, nullable: false, uniqueGroup: ["itemValue"] },
    title: { type: DataType.VarChar, length: 50, nullable: false, uniqueGroup: ["itemValue"] },
    value: { type: DataType.VarChar, length: 50, nullable: false, uniqueGroup: ["itemValue"] },
    //extData 扩展字段，应对各种临时/备用需求
    extData: { type: DataType.VarChar, length: 500, nullable: true },
    sort: { type: DataType.Int, default: 1 },
    remark: { type: DataType.VarChar, length: 255, nullable: true },
    enabled: { type: DataType.Int, default: 1 },
});



export const dictItemModel = await odm.model('dict_items', dictItemSchema);

export const dictTypeModel = await odm.model('dict_types', dictTypeSchema);
