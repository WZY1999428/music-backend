// 导入必需的模块
const path = require("path");
const fs = require("fs-extra");
const { pathToRegexp } = require("path-to-regexp"); // 注意：较新版本需解构

// 路由文件存放的根目录 (src/router)
const routerRootPath = path.join(__dirname, "../router");

// 定义支持的 HTTP 标准方法集合，用于校验文件名
const routeMethods = new Set(["get", "post", "put", "delete", "patch", "options", "head", "all"]);

// 存储需要鉴权的路由正则表达式集合
const authRouter = new Set();

/**
 * 核心函数：递归遍历路由目录并自动注册到 Koa-Router
 * @param {Object} router Koa-Router 实例
 */
function registerRoutes(router) {
    // 使用队列进行广度优先遍历 (BFS) 扫描目录
    const routeDirQueue = [routerRootPath];

    while (routeDirQueue.length) {
        const dir = routeDirQueue.shift();
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            // 1. 如果是目录，加入队列继续下一轮扫描
            if (stat.isDirectory()) {
                routeDirQueue.push(filePath);
                continue;
            }

            // 2. 获取相对路径并分析文件名
            const relativePath = path.relative(routerRootPath, filePath);
            const parse = path.parse(relativePath);

            // 仅处理 .js 或 .ts 文件
            if (![".js", ".ts"].includes(parse.ext)) continue;

            // 3. 处理路径层级：将系统路径分隔符替换为 URL 的正斜杠 /
            let routePath = `/${parse.dir.replaceAll(path.sep, "/")}`;
            
            // 4. 解析文件名约定。例如：user.post.js -> name 为 ["user", "post"]
            const name = parse.name.split(".");
            if (name.length > 2) {
                throw new Error(`[Router Warn] 文件 "${file}" 不支持多个方法（只能是 filename.method.js）`);
            }

            // 5. 处理路径名称：如果是 index 则置为空字符串（表示根路径）
            const routeName = name[0]?.replace("index", "");
            
            // 6. 解析动态参数：处理 [id] 这种格式为 :id
            const params = parseParam(routeName);
            if (params.length) {
                // 如果文件名是 [id]，转换为 /:id
                routePath += '/' + params.map(p => `:${p}`).join('/');
            } else if (routePath.length > 1 && routeName.length > 0) {
                // 如果不是 index 且不是参数，拼接文件名到路径中
                routePath = `${routePath}/${routeName}`
            }

            // 7. 确定请求方法：文件名带 .post 则为 post，否则默认为 get
            const method = name.length == 2 ? name[1] : "get";

            if (!routeMethods.has(method)) {
                console.warn(`[Router Warn] 文件 "${file}" 不支持 "${method}" 方法`);
                continue;
            }

            // 8. 动态导入路由处理模块
            const handler = require(filePath);
            const routeAction = handler.default || handler;

            // 情况 A: 直接导出一个函数 (ctx, next) => { ... }
            if (typeof routeAction === "function") {
                router[method](routePath, routeAction);
            } 
            // 情况 B: 导出一个对象 { handler, middleware, auth }
            else if (routeAction != null && !Array.isArray(routeAction) && typeof routeAction === "object") {
                if (!routeAction.handler) {
                    throw new Error(`[Router Error] 文件 "${file}" 没有导出一个有效的 handler 函数`);
                }

                // 合并中间件：支持单个中间件或中间件数组
                const middlewares = Array.isArray(routeAction.middleware) 
                    ? routeAction.middleware 
                    : (routeAction.middleware ? [routeAction.middleware] : []);

                // 注册路由：router.get('/path', mw1, mw2, handler)
                router[method](routePath, ...middlewares, routeAction.handler);

                // 9. 权限收集：如果配置了 auth: true，将路径转换为正则存入 authRouter
                if (routeAction.auth) {
                    authRouter.add(pathToRegexp(routePath));
                }
            } else {
                console.warn(`[Router Error] 文件 "${file}" 导出格式不正确`);
            }
        }
    }
}

/**
 * 解析文件名中的参数语法
 * 示例：[id] -> 返回 ["id"]
 * @param {string} routeName 
 */
function parseParam(routeName) {
    const paramRegex = /\[(\w+)\]/g;
    let match;
    const params = [];
    while ((match = paramRegex.exec(routeName)) !== null) {
        params.push(match[1]);
    }
    return params;
}

module.exports = { registerRoutes, authRouter };