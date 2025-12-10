require('module-alias/register')
const dotenv = require('dotenv');
const { resolve } = require('path');
require("@/utils/protoKit");
// 根据 NODE_ENV 加载对应 env 文件
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: resolve(__dirname, envFile) });
console.log("当前环境:", process.env.NODE_ENV);
console.log("PORT:", process.env.SERVER_PORT);

const createServer = require('./src/createServer');
createServer(); 