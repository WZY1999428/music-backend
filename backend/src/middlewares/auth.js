const { checkToken } = require("@/modules/tokens");
const { whileListMap } = require("@/utils/registerRoutes");
const { pathToRegexp } = require("path-to-regexp");
const noAuthRegex = Array.from(whileListMap.values()).map(p => pathToRegexp(p));
module.exports = function auth() {
    return async (ctx, next) => {
        const path = ctx.path;
        // 2️⃣ /api 下的请求
        if (path.startsWith('/api/')) {
            if (noAuthRegex.some(rx => rx.regexp.test(path))) return await next();
            // 需要 token 验证
            const token = ctx.headers['authorization']?.split(' ')[1];
            if (!token) return ctx.unauthorized('No token provided');
            try {
                const payload = await checkToken(token);
                ctx.state.user = payload; // 保存 payload 方便后续使用
            } catch (err) {
                return ctx.unauthorized(err.message);
            }
            return await next(); // token 验证成功才继续
        }
        // 3️⃣ 其他非 /api 或 /public 的路径直接放行（如前端页面）
        await next();
    };
};
