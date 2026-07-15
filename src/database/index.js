const MySqlODM = require("mysql-odm");

const odm = new MySqlODM();
const { MYSQL_HOST, MYSQL_PORT, MYSQL_USERNAME, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env;

async function initDb() {
    await odm.use({
        host: MYSQL_HOST,
        port: parseInt(MYSQL_PORT),
        user: MYSQL_USERNAME,
        password: MYSQL_PASSWORD,
        database: MYSQL_DATABASE
    }, "connection");
}

module.exports = { initDb, odm };
