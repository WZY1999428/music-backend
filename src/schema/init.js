const MySqlODM = require("mysql-odm");


const odm = new MySqlODM();

async function initDb() {
    await odm.use({
        host: "localhost",
        user: "root",
        password: "123456789",
        database: "koa-serve"
    }, "connection");
}

module.exports = { initDb, odm };
