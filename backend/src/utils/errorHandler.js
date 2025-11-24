
module.exports = function attachErrorHandler(app) {
    const whiteErrList = ["ECONNRESET", "ECONNABORTED", "ERR_STREAM_PREMATURE_CLOSE", "ERR_STREAM_DESTROYED", "EPIPE"];
    app.on("error", (err, ctx) => {
        if (!err) return;
        if (whiteErrList.includes(err.code)) return;
        console.error("SERVER ERROR:", err.code || err.message, err);
    });
}