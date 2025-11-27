// middlewares/httpResponse.js

module.exports = function httpResponse() {
    return async (ctx, next) => {
        // 成功
        ctx.success = (data = null, msg = "success", code = 0) => {
            ctx.status = 200
            ctx.body = { code, msg, data }
        }

        // 失败
        ctx.fail = (msg = "fail", code = 1, data = null) => {
            ctx.status = 200
            ctx.body = { code, msg, data }
        }

        // 分页
        ctx.page = (list = [], total = 0, msg = "success", code = 0) => {
            ctx.status = 200
            ctx.body = { code, msg, data: { list, total } }
        }

        // 未授权
        ctx.unauthorized = (msg = "Unauthorized", code = 401, data = null) => {
            ctx.status = 401  // HTTP 状态码
            ctx.body = { code, msg, data }
        }

        await next()
    }
}
