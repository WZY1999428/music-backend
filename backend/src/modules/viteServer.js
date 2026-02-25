const convert = require('koa-connect')
const path = require('path');
const rootPath = path.resolve(__dirname, '../../../frontend');
const HtmlPath = path.join(rootPath, 'index.html');
const fs = require('fs/promises');
module.exports = async function viteServerMiddleware(app) {
    // 以中间件模式创建 Vite 服务器
    const { createServer: createViteServer } = await import('vite');

    const viteServer = await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom',
        root: rootPath,
    })
    app.use(convert(viteServer.middlewares));
    // 捕获所有路由，渲染 Vue 页面
    app.use(async (ctx, next) => {
        const url = ctx.path;
        const startsWithsWhiteList = ["/api", "/@vite/", "/public"]
        const endsWithsWhiteList = [".js", ".ts", ".css", ".png", ".jpg", ".jpeg", ".gif"]
        if (startsWithsWhiteList.some(item => url.startsWith(item)) || endsWithsWhiteList.some(item => url.endsWith(item))) {
            return next();
        }
        // 处理 HTML
        try {
            const html = await fs.readFile(HtmlPath, 'utf-8');
            const template = await viteServer.transformIndexHtml(ctx.path, html);
            ctx.type = 'text/html';
            ctx.body = template;
        } catch (e) {
            console.error('Vite transform error:', e);
            ctx.status = 500;
            ctx.body = e.stack;
        }
    });
}