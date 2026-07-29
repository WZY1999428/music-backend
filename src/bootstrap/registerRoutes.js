// 导入必需的模块
import path from "path";
import { pathToFileURL } from "url";

import fs from "fs-extra";
import { pathToRegexp } from "path-to-regexp"; // 注意：较新版本需解构

// 路由文件存放的根目录 (src/router)
const routerRootPath = path.resolve(process.cwd(), "./src/router");
// 定义支持的 HTTP 标准方法集合，用于校验文件名
const routeMethods = new Set(["get", "post", "put", "delete", "patch", "options", "head", "all"]);
// 存储需要鉴权的路由正则表达式集合
export const routerWhiteList = new Set();
let isExecuted = false;
/**
 * 核心函数：递归遍历路由目录并自动注册到 Koa-Router
 * @param {Object} router Koa-Router 实例
 */
export async function registerRoutes(router) {
    if (isExecuted) {
        console.warn("[Router Warn] registerRoutes 已经执行过，跳过重复执行");
        return;
    }
    isExecuted = true;
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

            processFile(filePath)
            
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
            const handler = await import(pathToFileURL(filePath));
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
                // 9. 权限收集：如果配置了 auth: false，将路径转换为正则存入 routerWhiteList 不需要权限验证
                if (routeAction.auth === false) {
                    routerWhiteList.add(pathToRegexp(routePath));
                }
            } else {
                console.warn(`[Router Error] 文件 "${file}" 导出格式不正确`);
            }
        }
    }
}



//  定义你的 Controller JSDoc 模板
const JSDOC_TEMPLATE = '/** @type {Controller} */\n';
// 注入 koa ctx 提示内容
function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;

    // ---------------------------------------------------------
    // 情况 1：匹配 export default (async) (ctx...) => {
    // 支持同步函数 (ctx) => 和 异步函数 async (ctx) =>
    // ---------------------------------------------------------
    const pattern1 = /(?<!\/\*\*[\s\S]*?\*\/\s*)(^[ \t]*export\s+default\s+(?:async\s+)?\(\s*ctx[^)]*\)\s*=>)/gm;
    content = content.replace(pattern1, (match, p1) => {
        return `${JSDOC_TEMPLATE}${p1}`;
    });

    // ---------------------------------------------------------
    // 情况 2：匹配 handler: (async) (ctx...) => {
    // 自动保留 handler 原有的缩进空格
    // ---------------------------------------------------------
    const pattern2 = /(?<!\/\*\*[\s\S]*?\*\/\s*)(^[ \t]*handler\s*:\s*(?:async\s+)?\(\s*ctx[^)]*\)\s*=>)/gm;
    content = content.replace(pattern2, (match, p1) => {
        // 获取 p1 前面的缩进空白字符（如果有）
        const indent = p1.match(/^[ \t]*/)[0] || '';
        return `${indent}${JSDOC_TEMPLATE}${p1}`;
    });

    // 如果内容被修改了，重新写入文件
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`[JSDoc Injected] 已为文件注入提示: ${filePath}`);
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
