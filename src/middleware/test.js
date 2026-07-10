module.exports = () => {
    return async (ctx, next) => {
        console.log("我后执行")
        await next();
    }
} 