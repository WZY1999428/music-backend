const { Token } = require("../modules/sqlite/model");

const apiWhiteList = [
    /^\/api\/user\/login$/,
    /^\/api\/user\/initialize$/,
    /^\/api\/user\/status$/
];

module.exports = function auth() {
    return async (ctx, next) => {
        // const path = ctx.path;

        // // 直接放行 /public/* 资源
        // if (path.startsWith('/public/')) {
        //     await next();
        //     return;
        // }

        // // 只校验 /api 下的请求
        // if (path.startsWith('/api/')) {
        //     // 白名单放行
        //     if (apiWhiteList.some(rx => rx.test(path))) {
        //         await next();
        //         return;
        //     }

        //     // token 校验
        //     const token = await Token.findOne({ token: ctx.headers.authorization });
        //     if (!token || token.expires_at < Date.now()) {
        //         ctx.unauthorized();
        //         return;
        //     }
        // }

        // 其他非 /api 或 /public 的路径直接放行（如前端页面）
        await next();
    }
}
