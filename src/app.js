if (process.versions.node < "18.0.0") {
    throw new Error("Node.js version must be >= 18.0.0")
};

import Koa from "koa";
import { bodyParser } from "@koa/bodyparser"
import "./utils/valkey.js";
import { uploadPath } from "./utils/config.js";
import { registerRoutes } from "./bootstrap/registerRoutes.js";
import registerMiddleware from "./bootstrap/registerMiddleware.js";
import KoaRouter from "@koa/router";
import koaStatic from "koa-static";

import path from "path";
const app = new Koa();
const router = new KoaRouter();
await registerRoutes(router);
await registerMiddleware(app);

app.use(bodyParser())
    .use(koaStatic(path.resolve(process.env.PUBLIC_PATH)))
    .use(koaStatic(uploadPath))
    .use(router.routes())
    .use(router.allowedMethods());


const ignoredErrors = new Set([
    "ECONNRESET",
    "ECONNABORTED",
    "ERR_STREAM_PREMATURE_CLOSE",
    "ERR_HTTP_ABORTED",
]);

app.on("error", (error) => {
    if (ignoredErrors.has(error.code)) {
        return;
    }
    console.error("App error:", error);
});
export default app;

