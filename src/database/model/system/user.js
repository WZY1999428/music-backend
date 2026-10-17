import { odm, BaseSchema } from "@/database/index.js"
import { DataType } from "mysql-dsl/schema"

const userSchema = new BaseSchema({
    avatar: { type: DataType.VarChar, length: 255, nullable: true },
    username: { type: DataType.VarChar, length: 255, nullable: false, unique: true },
    nickname: { type: DataType.VarChar, length: 255, nullable: false },
    password: { type: DataType.VarChar, length: 255, nullable: false },
    email: { type: DataType.VarChar, length: 255, nullable: true, unique: true },
    phone: { type: DataType.VarChar, length: 50, nullable: false, unique: true },
    enabled: { type: DataType.Int, default: 1 },
    isSuperAdmin: { type: DataType.Int, default: 0 },
});

const userRoleSchema = new BaseSchema({
    userId: { type: DataType.BigInt, nullable: false, uniqueGroup: ["user_role_unique"] },
    roleId: { type: DataType.BigInt, nullable: false, uniqueGroup: ["user_role_unique"] },
});



const userDeptSchema = new BaseSchema({
    userId: { type: DataType.BigInt, nullable: false, uniqueGroup: ["user_dept_unique"] },
    deptId: { type: DataType.BigInt, nullable: false, uniqueGroup: ["user_dept_unique"] },
});

const userModel = await odm.model('system_user', userSchema);
export const userRoleModel = await odm.model('user_role', userRoleSchema);
export const userDeptModel = await odm.model('user_dept', userDeptSchema);



export default userModel;



