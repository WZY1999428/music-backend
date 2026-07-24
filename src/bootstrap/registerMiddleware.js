import path from "path";
import fs from "fs-extra";
import { pathToFileURL } from "url";

const middlewareRootPath = path.resolve("./src/middleware");
// 从 middleware.json 中读取中间件执行顺序和忽略列表
const middlewareConfig = JSON.parse(fs.readFileSync(path.join(middlewareRootPath, "middleware.json"), "utf-8"));
const middlewareOrder = new Set(middlewareConfig.order);
const middlewareIgnore = new Set(middlewareConfig.ignore);
function readFiles(middlewareRootPath) {
    const middlewares = []
    const stack = [middlewareRootPath]
    while (stack.length) {
        const current = stack.pop()
        const entries = fs.readdirSync(current, { withFileTypes: true })
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name)
            if (entry.isDirectory()) {
                stack.push(fullPath)
            } else if (fullPath.endsWith(".js")) {
                const middleware = path.relative(middlewareRootPath, fullPath).replaceAll(path.sep, '/');
                if (!middlewareIgnore.has(middleware)) {
                    middlewares.push(middleware)
                }
            }
        }
    }

    return middlewares
}

const middlewareFiles = readFiles(middlewareRootPath)


export default async (app) => {
    // 按照顺序注册中间件
    for (const middleware of middlewareOrder) {
        if (!middlewareIgnore.has(middleware)) await registerMiddleware(middleware, app);
    }
    for (const file of middlewareFiles) {
        if (!middlewareOrder.has(file)) await registerMiddleware(file, app);
    }

}


async function registerMiddleware(file, app) {
    const middlewarePath = path.join(middlewareRootPath, file);
    const middlewareFunc = await import(pathToFileURL(middlewarePath));
    app.use(await middlewareFunc.default());
}