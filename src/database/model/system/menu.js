import { odm } from "@/database/index.js"
import { convertIntFieldsToBoolean, convertBooleanFieldsToInt } from "@/database/utils.js"
import { Schema, DataType } from "mysql-odm/schema";

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
    type: { type: DataType.Int, default: 1, nullable: false },
    icon: { type: DataType.VarChar, length: 255, nullable: true },
    path: { type: DataType.VarChar, length: 255, nullable: true },
    component: { type: DataType.VarChar, length: 255, nullable: true },
    sort: { type: DataType.Int, default: 0, nullable: false },
    isLink: { type: DataType.Int, default: 1 },
    enabled: { type: DataType.Int, default: 1 },
    createdAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
    updatedAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
}, hooks);


const routeModel = await odm.model('menus', routeSchema);


const menuButtonSchema = new Schema({
    id: { type: DataType.BigInt, primaryKey: true, autoIncrement: { start: 10000, enabled: true } },
    menuId: { type: DataType.BigInt, nullable: false },
    name: { type: DataType.VarChar, length: 100, nullable: false },
    permission: { type: DataType.VarChar, length: 255, nullable: false },
    sort: { type: DataType.Int, default: 0, nullable: false },
    enabled: { type: DataType.Int, default: 1 },
    createdAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },
    updatedAt: { type: DataType.DateTime, default: 'CURRENT_TIMESTAMP' },

}, hooks);

export const menuButtonModel = await odm.model('menu_buttons', menuButtonSchema);

export default routeModel;
