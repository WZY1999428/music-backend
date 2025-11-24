
const Koa = require('koa');
const path = require('path');
const fs = require('fs/promises');
const registerRoutes = require('./utils/registerRoutes');
const rangeFile = require('./middlewares/rangeFile');
const attachErrorHandler = require('./utils/errorHandler');
const router = registerRoutes(path.join(__dirname, './routes'));
const HtmlPath = path.resolve(__dirname, '../../frontend/index.html');
const { createServer: createViteServer } = require('vite');
const convert = require('koa-connect')

async function createServer() {
    const app = new Koa();
    attachErrorHandler(app);

    // 以中间件模式创建 Vite 服务器
    const viteServer = await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom',
        root: path.resolve(__dirname, '../../frontend'),
    })
    app.use(convert(viteServer.middlewares));
    // 捕获所有路由，渲染 Vue 页面
    app.use(async (ctx, next) => {
        const url = ctx.path;
        const startsWithsWhiteList = ["/api", "/@vite/"]
        const endsWithsWhiteList = [".js", ".ts", ".css", ".png", ".jpg", ".jpeg", ".gif"]
        if(startsWithsWhiteList.some(item => url.startsWith(item)) || endsWithsWhiteList.some(item => url.endsWith(item))) {
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



    app.use(rangeFile(path.join(__dirname, 'public')));
    app.use(router.routes()).use(router.allowedMethods());
    app.listen(3000, () => console.log('http://localhost:3000'));
}

module.exports = createServer;