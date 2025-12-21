module.exports = function attachErrorHandler(app) {
    const whiteErrList = ["ECONNRESET", "ECONNABORTED", "ERR_STREAM_PREMATURE_CLOSE", "ERR_STREAM_DESTROYED", "EPIPE"];
    
    app.on("error", (err, ctx) => {
        // 白名单直接忽略
        const code = err.code || err.name || ""
        if (whiteErrList.includes(code)) return;
        console.error("服务器错误:", err);
        if (ctx && !ctx.headerSent) { // 确保请求还没发送响应
            ctx.status = 500;
            ctx.body = { code: 500, msg: "服务器错误", data: err.message };
        }
    });
}
