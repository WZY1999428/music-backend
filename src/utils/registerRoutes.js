// 导入必需的模块
const path = require("path");
const fs = require("fs-extra");
const pathToRegexp = require("path-to-regexp");

// 定义路由根路径
const routerRootPath = path.join(__dirname, "../router");

// 定义支持的路由方法
const routeMethods = new Set(["get", "post", "put", "delete", "patch", "options", "head", "all"]);

// 定义认证路由
const authRouter = new Set();

// 注册路由函数
function registerRoutes(router) {
    // 路由目录队列
    const routeDirQueue = [routerRootPath];

    // 遍历路由目录
    while (routeDirQueue.length) {
        const dir = routeDirQueue.shift();
        const files = fs.readdirSync(dir);

        // 遍历文件
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                // 如果是目录，加入队列继续遍历
                routeDirQueue.push(filePath);
                continue;
            }

            // 2. 获取相对于 router 目录的相对路径
            const relativePath = path.relative(routerRootPath, filePath);
            const parse = path.parse(relativePath)
            if (![".js", ".ts"].includes(parse.ext)) continue;
            let routePath = `/${parse.dir.split(path.sep).join("/")}`;

            const name = parse.name.split(".");
            if (name.length > 2) {
                throw new Error(`[Router Warn] 文件 "${file}" 不支持多个方法`);
            }

            const routeName = name[0]?.replace("index", "");
            const params = parseParam(routeName);
            // 拼接路由路径
            if (params.length) {
                routePath += '/' + params.map(p => `:${p}`).join('/');
            } else if (routePath.length > 1 && routeName.length > 0) {
                routePath = `${routePath}/${routeName}`
            }

            const method = name.length == 2 ? name[1] : "get";

            if (!routeMethods.has(method)) {
                console.warn(`[Router Warn] 文件 "${file}" 不支持 "${method}" 方法`);
                continue;
            }

            // 8. require 路由模块
            const handler = require(filePath);
            // 兼容 ES Module 的 default 导出，以及 CommonJS 导出
            const routeAction = handler.default || handler;

            // 9. 注册路由 (支持单个函数和对象)
            if (typeof routeAction === "function") {
                router[method](routePath, routeAction);
            } else if (routeAction != null && !Array.isArray(routeAction) && typeof routeAction === "object") {
                if (!routeAction.handler) {
                    throw new Error(`[Router Error] 文件 "${file}" 没有导出一个有效的处理函数`);
                }
                const middlewares = Array.isArray(routeAction.middleware) ? routeAction.middleware : routeAction.middleware ? [routeAction.middleware] : [];
                router[method](routePath, ...middlewares, routeAction.handler);

                if (routeAction.auth) {
                    authRouter.add(pathToRegexp(routePath));
                }
            } else {
                console.warn(`[Router Error] 文件 "${file}" 没有导出一个有效的处理函数或中间件数组`);
            }
        }

    }
}

// 解析路由参数
function parseParam(routeName) {
    const paramRegex = /\[(\w+)\]/g;
    let match;
    const params = [];
    // 提取所有中括号参数
    while ((match = paramRegex.exec(routeName)) !== null) {
        params.push(match[1]);
    }
    return params;
}

// 导出模块
module.exports = { registerRoutes, authRouter };