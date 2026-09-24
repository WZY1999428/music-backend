import { odm, BaseSchema } from "@/database/index.js"
import { DataType } from "mysql-dsl/schema";


const routeSchema = new BaseSchema({
    parentId: { type: DataType.BigInt, default: 0, uniqueGroup: ['parentIdSort'] },
    title: { type: DataType.VarChar, length: 255, nullable: false },
    type: { type: DataType.Int, default: 1, nullable: false },
    icon: { type: DataType.VarChar, length: 255, nullable: true },
    path: { type: DataType.VarChar, length: 255, nullable: false, unique: true },
    sort: { type: DataType.Int, default: 0, nullable: false, uniqueGroup: ['parentIdSort'] },
    component: { type: DataType.VarChar, length: 255, nullable: true },
    isLink: { type: DataType.Int, default: 1 },
    isHome: { type: DataType.Int, default: 0 },
    enabled: { type: DataType.Int, default: 1 },
    visible: { type: DataType.Int, default: 0 },
});


const menuPermissionsSchema = new BaseSchema({
    routeId: { type: DataType.BigInt, nullable: false, },
    name: { type: DataType.VarChar, length: 100, nullable: false },
    permission: { type: DataType.VarChar, length: 255, nullable: false, unique: true },
    enabled: { type: DataType.Int, default: 1 },
});

const apiSchema = new BaseSchema({
    permissionsId: { type: DataType.BigInt, nullable: false, },
    method: { type: DataType.VarChar, length: 10, nullable: false },
    path: { type: DataType.VarChar, length: 255, nullable: false },
});

const routeModel = await odm.model('menus', routeSchema);
export const menuPermissionsModel = await odm.model('menu_permissions', menuPermissionsSchema);
export const apiModel = await odm.model('permissions_api', apiSchema);

export default routeModel;
