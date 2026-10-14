import { odm, BaseSchema } from "@/database/index.js"
import { DataType } from "mysql-dsl/schema"

const appUserSchema = new BaseSchema({
    username: { type: DataType.VarChar, length: 255, nullable: false, unique: true }, // 用户名
    nickname: { type: DataType.VarChar, length: 255, nullable: false },               // 昵称
    password: { type: DataType.VarChar, length: 255, nullable: false },               // 密码（加密后）
    avatar: { type: DataType.VarChar, length: 255, nullable: true },                  // 头像
    email: { type: DataType.VarChar, length: 255, nullable: true, unique: true },     // 邮箱
    phone: { type: DataType.VarChar, length: 50, nullable: true, unique: true },      // 手机号
    gender: { type: DataType.Int, default: 0 },                                       // 性别 (0: 未知, 1: 男, 2: 女)
    birthday: { type: DataType.VarChar, length: 50, nullable: true },                 // 生日（如："2000-01-01"）
    signature: { type: DataType.VarChar, length: 500, nullable: true },               // 个性签名
    lastLoginAt: { type: DataType.DateTime, nullable: true },                         // 最后登录时间
    lastLoginIp: { type: DataType.VarChar, length: 50, nullable: true },              // 最后登录IP
    enabled: { type: DataType.Int, default: 1 },                                      // 状态 (0: 禁用, 1: 正常)
});

const appUserModel = await odm.model('app_user', appUserSchema);

export default appUserModel;
