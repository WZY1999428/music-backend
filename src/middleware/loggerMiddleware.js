import systemLogModel from "@/database/model/system/logger.js"
import { routeMetaMap } from "@/bootstrap/registerRoutes.js"
export default () => {
    const logCachedData = [];
    setInterval(() => writeLog(logCachedData, true), 3000);
    /** @type {Controller} */
    return async (ctx, next) => {
        const startTime = Date.now();
        try {
            await next();
        }
        finally {
            // 优先读取路由模块中配置的 logType 和 action
            const path = ctx.path;
            for (const regex of routeMetaMap.keys()) {
                if (regex.test(path)) {
                    const method = ctx.method;
                    const routeMeta = routeMetaMap.get(regex);
                    const methodConfig = [...routeMeta.methods.values()].find(item => item.method.toUpperCase() == method);
                    if (!methodConfig || !methodConfig.enableLog) {
                        break;
                    }
                    const user = ctx.user;
                    const reqParams = {};
                    const resBody = ctx.response.body;
                    const { params, query, body } = ctx.request;
                    if (!isEmptyObject(params)) reqParams.params = params;
                    if (!isEmptyObject(query)) reqParams.query = query;
                    if (!isEmptyObject(body)) reqParams.body = body;

                    const logger = {
                        // 1. 操作主体信息（谁干的）
                        userId: user?.userId || null,
                        username: user?.username || "",
                        nickname: user?.nickname || "",
                        roleName: user?.roleName || "",
                        logType: methodConfig?.logType || (ctx.status >= 500 ? 'SYSTEM' : 'OPERATION'),
                        action: methodConfig?.action || ctx.path, // 操作描述
                        method: ctx.method,
                        requestUrl: ctx.url,
                        ip: getIp(ctx),                // 客户端 IP 地址（支持 IPv6）
                        userAgent: ctx.headers['user-agent'],                       // 浏览器/客户端环境标示
                        reqParams: stringifyLogBody(reqParams),                       // 请求参数（Body / Query / Params，建议脱敏后存为 JSON）
                        resBody: stringifyLogBody(resBody),                         // 响应结果（接口返回的 JSON，可选存储）
                        status: ctx.status,
                        executionTime: Date.now() - startTime,
                        errorMessage: resBody?.code == 1 ? resBody.message : null,                    // 异常堆栈 / 错误摘要（仅在报错时记录）
                    }

                    logCachedData.push(logger)
                    break;
                }
            }
            writeLog(logCachedData)
            // 异步写入数据库
        }
    }
}


/**
 * 检查值是否为 null、undefined 或空对象 {}
 */
function isEmptyObject(obj) {
    if (obj === null || obj === undefined) return true;

    // 确保传入的是纯粹的对象类型 (排除 Date, Array, RegExp 等)
    if (typeof obj === 'object' && obj.constructor === Object) {
        return Object.keys(obj).length === 0;
    }

    return false;
}
function stringifyLogBody(body, maxLength = 1000) {
    if (body == null) return null;

    let result;

    try {
        result = typeof body === 'string'
            ? body
            : JSON.stringify(body);
    } catch {
        return '[Unserializable]';
    }

    if (result.length > maxLength) {
        return result.slice(0, maxLength) + '...';
    }

    return result;
}

function getIp(ctx) {
    // Headers to check in order of preference
    const headers = [
        'x-forwarded-for',
        'x-real-ip',
        'cf-connecting-ip',
        'x-client-ip',
        'http_x_forwarded_for',
        'http_client_ip',
    ];

    for (const header of headers) {
        const ip = ctx.get(header);
        if (ip) {
            // Handle comma-separated IPs (x-forwarded-for can contain multiple IPs)
            const ips = ip.split(',').map(ip => ip.trim());
            // Return the first valid IP (client IP is usually first)
            for (const ip of ips) {
                if (isValidIp(ip)) {
                    return ip;
                }
            }
        }
    }

    // Fallback to ctx.ip (Koa's built-in IP detection)
    return ctx.ip || '';
}

function isValidIp(ip) {
    if (!ip || ip === 'unknown') return false;

    // IPv4 regex
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    // IPv6 regex (simplified)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$|^(?:[0-9a-fA-F]{1,4}:){0,6}::$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

function writeLog(logCachedData, force = false) {
    if (!logCachedData.length) return;
    if (!force && logCachedData.length < 30) return;

    const logs = logCachedData.splice(0);
    if (logs.length) {
        systemLogModel.insertMany(logs).catch(console.error);
    }

}


