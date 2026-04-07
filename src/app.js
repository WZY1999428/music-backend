if (process.versions.node < "18.0.0") {
    throw new Error("Node.js version must be >= 18.0.0")
};

const Koa = require("koa");
const valkey = require("@/utils/valkey");
const { registerRoutes } = require("@/utils/registerRoutes");
const KoaRouter = require("@koa/router");

const MySqlODM = require("mysql-odm");
(async () => {
    const odm = new MySqlODM();
    await odm.use({
        host: "localhost",
        user: "root",
        password: "123456789",
        database: "1111"
    }, "connection");
})


const app = new Koa();
const router = new KoaRouter();
app.context.valkey = valkey;

registerRoutes(router);

app.use(router.routes()).use(router.allowedMethods());

module.exports = app;

