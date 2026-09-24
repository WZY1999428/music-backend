import systemLoggerModel from "@/database/model/system/logger.js"
export default {
    action: '获取日志详情',
    logType: 'GET_LOG_DETAIL',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        const logger = await systemLoggerModel.findOne({ id })
        if (!logger) return ctx.fail("日志不存在")
        ctx.success(logger)
    },
}