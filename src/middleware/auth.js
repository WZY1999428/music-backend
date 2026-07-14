const { routerWhiteList } = require("../bootstrap/registerRoutes.js");
const valkey = require("../utils/valkey.js");
module.exports = () => {
    const whiteMatchers = Array.from(routerWhiteList.values());
    return async (ctx, next) => {
        const isWhite = whiteMatchers.some(item => item.regexp.test(ctx.path))
        const info = await valkey.getToken(ctx.headers["authorization"])
        console.log(info);
        if (ctx.path.startsWith("/admin-api") && !isWhite && !info) {
            ctx.unauthorized();
            return;
        }
        ctx.user = info;
        await next();
    }
} 