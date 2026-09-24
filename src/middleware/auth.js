import { routerWhiteList } from "@/bootstrap/registerRoutes.js";
import valkey from "@/utils/valkey.js";
export default () => {
    const whiteMatchers = Array.from(routerWhiteList.values());
    return async (ctx, next) => {
        const isWhite = whiteMatchers.some(item => item.regexp.test(ctx.path))
        const token = ctx.headers["authorization"]
        const isAdmin = ctx.path.startsWith("/admin-api");
        if (isAdmin) {
            const info = await valkey.getToken(token)
            if (!isWhite && !info) {
                ctx.unauthorized();
                return;
            }
            ctx.token = token;
            ctx.user = info;
        }

        await next();
    }
}


