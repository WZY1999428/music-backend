
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
        .use(require('./middlewares/rangeFile')(path.join(__dirname, process.env.PUBLIC_FILE_PATCH)))
        .use(require('./middlewares/httpResponse')())
        .use(require('./middlewares/auth')())
        .use(router.routes())
        .use(router.allowedMethods())
        .listen(process.env.SERVER_PORT, () => {
            console.log("服务已启动：");
            console.blueLog(`          http://localhost:${process.env.SERVER_PORT}`)
            console.blueLog(`          http://${getLocalIPv4()}:${process.env.SERVER_PORT}`)
        });

}


function getLocalIPv4() {
    const os = require("os");
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // 只要 IPv4、非内网回环、非虚拟网卡
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return '127.0.0.1'; // 找不到就用本地回环
}


module.exports = createServer;