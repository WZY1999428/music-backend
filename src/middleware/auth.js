import { routerWhiteList, appRouterWhiteList } from "@/bootstrap/registerRoutes.js";
export default () => {
    const whiteMatchers = Array.from(routerWhiteList.values());
    const appwhiteMatchers = Array.from(appRouterWhiteList.values());
    return async (ctx, next) => {
        const token = ctx.headers["authorization"]

        const isAdmin = ctx.path.startsWith("/admin-api");
        if (isAdmin) {
            const isWhite = whiteMatchers.some(item => item.regexp.test(ctx.path))
            const info = await getAdminToken(token)
            if (!isWhite && !info) {
                ctx.unauthorized();
                return;
            }
            ctx.user = info;
        } else if (ctx.path.startsWith("/api")) {
            const isWhite = appwhiteMatchers.some(item => item.regexp.test(ctx.path))
            const info = await getAppToken(token)
            if (!isWhite && !info) {
                ctx.unauthorized();
                return;
            }
            ctx.appUser = info;
        }
        ctx.token = token;
        await next();
    }
}


