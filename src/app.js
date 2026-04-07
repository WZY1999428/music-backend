const Koa = require("koa");
const valkey = require("#/utils/valkey");
const { registerRoutes } = require("#/utils/registerRoutes");
const KoaRouter = require("@koa/router");

const app = new Koa();
const router = new KoaRouter();
app.context.valkey = valkey;

registerRoutes(router);

app.use(router.routes()).use(router.allowedMethods());

module.exports = app; 

