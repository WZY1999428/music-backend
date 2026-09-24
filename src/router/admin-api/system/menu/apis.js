import { routeOptions } from "@/bootstrap/registerRoutes.js";

export default {
    action: '获取接口列表',
    logType: 'GET_SYSTEM_APIS',
    /** @type {Controller} */
    handler: async (ctx) => {
        const apis = [];
        for (const url of routeOptions.keys()) {
            const methods = routeOptions.get(url);
            for (const method of methods) {
                apis.push({ value: `${method} : ${url}`, label: `${method} : ${url}`, method })
            }
        }
        ctx.success(apis);
    },
}