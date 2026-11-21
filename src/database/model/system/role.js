import { odm, BaseSchema } from "@/database/index.js"
const { DataType } = await import("mysql-dsl/schema");
const roleSchema = new BaseSchema({
    name: { type: DataType.VarChar, length: 255, nullable: false },
    weight: { type: DataType.Int, default: 0, nullable: false },
    enabled: { type: DataType.Int, default: 1 },
});


const rolePermissionSchema = new BaseSchema({
    roleId: {
        type: DataType.VarChar,
        length: 36,
        nullable: false,
        uniqueGroup: ["permission"],
    },

    routeId: {
        type: DataType.VarChar, 
        length: 36,
        nullable: false
    },

    permissionId: {
        type: DataType.VarChar, 
        length: 36,
        nullable: true,
        uniqueGroup: ["permission"],
    },

    permissionType: {
        type: DataType.Int,
        default: 1,
        nullable: false,
        uniqueGroup: ["permission"],
    },
});

export const roleModel = await odm.model('roles', roleSchema);
export const rolePermissionModel = await odm.model('role_permissions', rolePermissionSchema);
