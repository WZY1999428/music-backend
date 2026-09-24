import { odm, BaseSchema } from "@/database/index.js"
import { DataType } from "mysql-dsl/schema"

const uploadSchema = new BaseSchema({
    userId: { type: DataType.BigInt, nullable: true },
    originalName: { type: DataType.VarChar, length: 255, nullable: false },
    filename: { type: DataType.VarChar, length: 255, nullable: false },
    url: { type: DataType.VarChar, length: 255, nullable: false },
    size: { type: DataType.BigInt, nullable: false },
    type: { type: DataType.Char, length: 50, nullable: false },
    mimeType: { type: DataType.VarChar, length: 255, nullable: false },
});

const uploadModel = await odm.model('upload', uploadSchema);



export default uploadModel;  