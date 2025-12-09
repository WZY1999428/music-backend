const { callThreadsafeFunction } = require('./native-code.win32-x64-msvc.node');

callThreadsafeFunction('D:/迅雷下载', (err, arg) => {
    console.log(err, arg);
});



setInterval(() => {

}, 1000);