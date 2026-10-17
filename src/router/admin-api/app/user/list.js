import userModel from "@/database/model/app/user/user.js"
export default {
    action: '获取用户列表',
    logType: 'GET_APP_USER_LIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { username, nickname, dateRange, enabled, pageIndex, pageSzie } = ctx.request.params;
        const query = {};
        if (username) query.username = { $like: `%${username}%` };
        if (nickname) query.nickname = { $like: `%${nickname}%` };
        if (enabled !== undefined) query.enabled = enabled;
        if (Array.isArray(dateRange) && dateRange.length == 2) {
            const range = toDateTimeRange(dateRange);
            query.createdAt = { $between: range };
        }
        const [users, total] = await Promise.all([
            userModel.findMany(query, { ...paginate(pageIndex, pageSzie) }),
            userModel.count(query)
        ]);
        ctx.success({
            list: users,
            total
        });
    }
}
