import { odm, BaseSchema } from "@/database/index.js"
import { DataType } from "mysql-dsl/schema"

const bannerSchema = new BaseSchema({
    image: { type: DataType.VarChar, length: 255, nullable: false },
    type: { type: DataType.Char, length: 60, nullable: false },
    title: { type: DataType.VarChar, length: 255, nullable: false },
    value: { type: DataType.VarChar, length: 255, nullable: false },
    desc: { type: DataType.VarChar, length: 255, nullable: false },
    enabled: { type: DataType.Int, nullable: false, default: 1 },
    createUserId: { type: DataType.BigInt, nullable: false },
    sort: { type: DataType.Int, nullable: false, default: 0 },
});

const bannerModel = await odm.model('banner', bannerSchema);



export default bannerModel;  