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
        return data
    }
};

const roleSchema = new Schema({
    id: { type: DataType.BigInt, primaryKey: true, autoIncrement: { start: 10000, enabled: true } },
    name: { type: DataType.VarChar, length: 255, nullable: false },
    sort: { type: DataType.Int, default: 0, nullable: false },
    enabled: { type: DataType.Int, default: 1 },
    createdAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
    updatedAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
}, hooks);



const roleMenuSchema = new Schema({
    id: { type: DataType.BigInt, primaryKey: true, autoIncrement: { start: 10000, enabled: true } },
    roleId: { type: DataType.VarChar, length: 255, nullable: false },
    routeId: { type: DataType.Int, default: 0, nullable: false },
    createdAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
});


const menuPermissionsSchema = new Schema({
    id: { type: DataType.BigInt, primaryKey: true, autoIncrement: { start: 10000, enabled: true } },
    permissionId: { type: DataType.VarChar, length: 255, nullable: false },
    roleId: { type: DataType.VarChar, length: 255, nullable: false },
    routeId: { type: DataType.Int, default: 0, nullable: false },
    createdAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
});


export const roleModel = await odm.model('roles', roleSchema);
export const roleMenuModel = await odm.model('role_menus', roleMenuSchema);
export const menuPermissionsModel = await odm.model('menu_permissions_model', menuPermissionsSchema);
