import { odm } from "@/database/index.js"
import { Schema, DataType } from "mysql-odm/schema"
const hooks = {
    beforeInsert(data) {
    },
    beforeUpdate(_, data) {
    }
};

const userSchema = new Schema({
    id: { type: DataType.BigInt, primaryKey: true, autoIncrement: true },
    username: { type: DataType.VarChar, length: 255, nullable: false },
    password: { type: DataType.VarChar, length: 255, nullable: false },
    email: { type: DataType.VarChar, length: 255, nullable: false },
    rule: { type: DataType.VarChar, length: 255, nullable: false },
    createdAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
    updatedAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
}, hooks);

const userModel = await odm.model('user', userSchema);


export default userModel;