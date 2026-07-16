class AppError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = "AppError";
        this.code = options.code ?? "ERROR";
        this.status = options.status ?? 400;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }


    static fail(message) {
        return new AppError(message, "FAIL", 200);
    }


    static badRequest(message) {
        return new AppError(message, "BAD_REQUEST", 400);
    }

    static unauthorized(message = "未登录") {
        return new AppError(message, "UNAUTHORIZED", 401);
    }

    static forbidden(message = "无权限") {
        return new AppError(message, "FORBIDDEN", 403);
    }

    static notFound(message = "不存在") {
        return new AppError(message, "NOT_FOUND", 404);
    }
}

module.exports = AppError;