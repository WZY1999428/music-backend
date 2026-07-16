const { odm } = require("../..")
const { Schema,DataType } = require("mysql-odm/schema");
const hooks = {
    beforeInsert(data) {
    },
    beforeUpdate(_, data) {
    }
};

const userSchema = new Schema({
    id: { type:  DataType.BigInt, primaryKey: true, autoIncrement: true },
    username: { type:  DataType.VarChar, length: 255, nullable: false },
    password: { type: DataType.VarChar, length: 255, nullable: false },
    email: { type: DataType.VarChar, length: 255, nullable: false },
    rule: { type: DataType.VarChar, length: 255, nullable: false },
    createdAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
    updatedAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
}, hooks);

const userModel = odm.model('user', userSchema);

module.exports = userModel;