const { routerWhiteList } = require("../bootstrap/registerRoutes.js");
module.exports = () => {
    const whiteMatchers = Array.from(routerWhiteList.values());
    return async (ctx, next) => {
        const isWhite = whiteMatchers.some(item => item.regexp.test(ctx.path))
        if (ctx.path.startsWith("/admin-api") && !isWhite) {
            ctx.unauthorized();
            return;
        }
        await next();
    }
} 