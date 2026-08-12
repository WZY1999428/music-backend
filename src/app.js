if (process.versions.node < "18.0.0") {
    throw new Error("Node.js version must be >= 18.0.0")
};


import Koa from "koa";
import { bodyParser } from "@koa/bodyparser"
import valkey from "./utils/valkey.js"; 
import { registerRoutes } from "./bootstrap/registerRoutes.js";
import registerMiddleware from "./bootstrap/registerMiddleware.js";
import KoaRouter from "@koa/router";

const app = new Koa();
const router = new KoaRouter();
console.log(router)
await registerRoutes(router);
await registerMiddleware(app);
app.context.valkey = valkey;
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

export default app;

