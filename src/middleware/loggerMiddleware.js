import systemLogModel from "@/database/model/system/log.js"
import { routeMetaMap } from "@/bootstrap/registerRoutes.js"
export default () => {
    const logCachedData = [];
    setInterval(() => writeLog(logCachedData, true), 3000);
    /** @type {Controller} */
    return async (ctx, next) => {
        const startTime = Date.now();
        try {
            await next();
        } finally {
            // 优先读取路由模块中配置的 logType 和 action
            const path = ctx.path;
            for (const regex of routeMetaMap.keys()) {
                if (regex.test(path)) {
                    const routeMeta = routeMetaMap.get(regex);
                    logCachedData.push({
                        logType: routeMeta.logType || (ctx.status >= 500 ? 'SYSTEM' : 'OPERATION'),
                        action: routeMeta.action || ctx.path, // 操作描述
                        userId: ctx.state.user?.id || null,
                        method: ctx.method,
                        requestUrl: ctx.url,
                        status: ctx.status,
                        executionTime: Date.now() - startTime,
                        reqParams: JSON.stringify(ctx.request.body || {}),
                        resBody: "{}",
                    })
                    break;
                }
            }
            writeLog(logCachedData)
            // 异步写入数据库
        }
    }
}


function writeLog(logCachedData, force = false) {
    if (!logCachedData.length) return;
    if (!force && logCachedData.length < 30) return;

    const logs = logCachedData.splice(0);
    if (logs.length) {
        systemLogModel.insertMany(logs).catch(console.error);
    }

}


