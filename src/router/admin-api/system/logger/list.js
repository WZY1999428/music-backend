import systemLoggerModel from "@/database/model/system/logger.js"
export default {
    action: '获取日志列表',
    logType: 'GET_LOG_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { username, roleName, ["dateRange[]"]: dateRange = [], method, pageIndex = 0, pageSize = 20 } = ctx.request.query;
        const query = {};
        if (username && username.trim()) query.username = { $like: `%${username.trim()}%` };
        if (roleName && roleName.trim()) query.logType = { $like: `%${roleName.trim()}%` };
        if (method && method.trim()) query.method = { $like: `%${method.trim()}%` };

        if (Array.isArray(dateRange) && dateRange.length == 2) {
            const range = toDateTimeRange(dateRange);
            query.createdAt = { $between: range };
        }
        const page = paginate(pageIndex, pageSize);
        const [list, total] = await Promise.all([
            systemLoggerModel.findMany(query, { ...page, sort: { createdAt: 'desc' } }),
            systemLoggerModel.count({ query })
        ])
        ctx.success({
            list,
            total
        })
    },
}