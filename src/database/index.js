import MySqlODM from "mysql-dsl"
import { Schema, DataType } from "mysql-dsl/schema";
export const odm = new MySqlODM({ debug: true });
const { MYSQL_HOST, MYSQL_PORT, MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env;
export async function initDb() {
    await odm.use({
        host: MYSQL_HOST,
        port: parseInt(MYSQL_PORT),
        user: MYSQL_USERNAME,
        password: MYSQL_PASSWORD,
        database: MYSQL_DATABASE,
        createDatabase: true
    });

}

export class BaseSchema extends Schema {
    constructor(fields) {
        super({
            id: {
                type: DataType.BigInt,
                primaryKey: true,
                autoIncrement: { start: 10000, enabled: true }
            },
            ...fields, // 传入的具体业务字段放在中间
            createdAt: {
                type: DataType.DateTime,
                default: 'CURRENT_TIMESTAMP'
            },
            updatedAt: {
                type: DataType.DateTime,
                default: 'CURRENT_TIMESTAMP',
                onUpdate: 'CURRENT_TIMESTAMP'
            },
        });
    }
}