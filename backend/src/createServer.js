
const Koa = require('koa');
const path = require('path');
const registerRoutes = require('./utils/registerRoutes');
const viteServerMiddleware = require('./middlewares/viteServer');
const attachErrorHandler = require('./utils/errorHandler');
const router = registerRoutes(path.join(__dirname, './routes'));

async function createServer() {
    const app = new Koa();
    attachErrorHandler(app);
    await viteServerMiddleware(app);
    app
        .use(require('./middlewares/rangeFile')(path.join(__dirname, 'public')))
        .use(require('./middlewares/httpResponse')())
        .use(require('./middlewares/auth')())
        .use(router.routes())
        .use(router.allowedMethods())
        .listen(process.env.SERVER_PORT, () => console.log(`http://localhost:${process.env.SERVER_PORT}`));
}

module.exports = createServer;