import MySqlODM from "mysql-odm"
export const odm = new MySqlODM.default();
const { MYSQL_HOST, MYSQL_PORT, MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env;
export async function initDb() {
    await odm.use({
        host: MYSQL_HOST,
        port: parseInt(MYSQL_PORT),
        user: MYSQL_USERNAME,
        password: MYSQL_PASSWORD,
        database: MYSQL_DATABASE
    });
}

