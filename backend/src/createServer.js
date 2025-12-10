
const Koa = require('koa');
const path = require('path');
const { bodyParser } = require('@koa/bodyparser');
const registerRoutes = require('./utils/registerRoutes');
const viteServerMiddleware = require('./modules/viteServer');
const attachErrorHandler = require('./utils/errorHandler');
const router = registerRoutes(path.join(__dirname, './routes'));
const initializeFileDatabase = require('./modules/fileSystem/initializeFileDatabase');
async function createServer() {
    const app = new Koa();
    attachErrorHandler(app);
    await viteServerMiddleware(app);
    if (!await initializeFileDatabase()) {
        console.log('文件数据库初始化失败');
        process.exit(1);
    }
    app
        .use(bodyParser())
        .use(require('./middlewares/rangeFile')(path.join(__dirname, '../public')))
        .use(require('./middlewares/httpResponse')())
        .use(require('./middlewares/auth')())
        .use(router.routes())
        .use(router.allowedMethods())
        .listen(process.env.SERVER_PORT, () => console.blueLog(` http://localhost:${process.env.SERVER_PORT}`));

}




module.exports = createServer;