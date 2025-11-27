module.exports = function auth() {
    return async (ctx, next) => {
        await next();
    }
}