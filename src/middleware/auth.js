import { routerWhiteList } from "@/bootstrap/registerRoutes.js";
import valkey from "@/utils/valkey.js";
export default () => {
    const whiteMatchers = Array.from(routerWhiteList.values());
    return async (ctx, next) => {
        const isWhite = whiteMatchers.some(item => item.regexp.test(ctx.path))
        const info = await valkey.getToken(ctx.headers["authorization"])
        if (ctx.path.startsWith("/admin-api") && !isWhite && !info) {
            ctx.unauthorized();
            return;
        }
        ctx.user = info;
        await next();
    }
} 


