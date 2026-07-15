if (process.versions.node < "18.0.0") {
    throw new Error("Node.js version must be >= 18.0.0")
};
const Koa = require("koa");
const { bodyParser  } = require("@koa/bodyparser")
const valkey = require("@/utils/valkey");
const { registerRoutes } = require("@/bootstrap/registerRoutes");
const registerMiddleware = require("./bootstrap/registerMiddleware");
const KoaRouter = require("@koa/router");

const app = new Koa();
const router = new KoaRouter();

app.context.valkey = valkey;

registerMiddleware(app);
registerRoutes(router);
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

module.exports = app;

