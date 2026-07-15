const { odm } = require("@/database")
const { convertIntFieldsToBoolean, convertBooleanFieldsToInt } = require("@/database/utils")
const { Schema, DataType } = require("mysql-odm/schema");
const hooks = {
    beforeInsert(data) {
        convertIntFieldsToBoolean(data, ['isLink', 'enabled'])
    },
    beforeUpdate(_, data) {
        convertIntFieldsToBoolean(data, ['isLink', 'enabled'])
    },
    afterFind(data) {
        if (data) convertBooleanFieldsToInt(data, ['isLink', 'enabled'])
    }
};

const routeSchema = new Schema({
    id: { type: DataType.BigInt, primaryKey: true, autoIncrement: { start: 10000, enabled: true } },
    parentId: { type: DataType.BigInt, default: 0 },
    title: { type: DataType.VarChar, length: 255, nullable: false },
    icon: { type: DataType.VarChar, length: 255, nullable: false },
    path: { type: DataType.VarChar, length: 255, nullable: false },
    component: { type: DataType.VarChar, length: 255, nullable: false },
    sort: { type: DataType.Int, default: 0, nullable: false },
    isLink: { type: DataType.Int, default: 1 },
    enabled: { type: DataType.Int, default: 1 },
    createdAt: { type: DataType.Date, default: 'CURRENT_TIMESTAMP' },
    updatedAt: { type: DataType.Date, default: 'CURRENT_TIMESTAMP' },
}, hooks);


const routeModel = odm.model('routes', routeSchema);
module.exports = routeModel;
