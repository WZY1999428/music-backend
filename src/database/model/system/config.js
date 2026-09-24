import { odm, BaseSchema } from "@/database/index.js"
const { DataType } = await import("mysql-dsl/schema");


const configSchema = new BaseSchema({
    // 配置键，唯一
    configKey: { type: DataType.VarChar, length: 100, unique: true },
    // 配置值
    configValue: { type: DataType.Text },
    // 配置类型
    configType: { type: DataType.VarChar, length: 100 },
});

const systemConfigModel = await odm.model('system_config', configSchema);
export default systemConfigModel;
