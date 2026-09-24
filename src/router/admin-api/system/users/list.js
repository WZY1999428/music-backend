import userModel from "@/database/model/user/index.js"
import { NORMAL_ENABLED_USER_QUERY } from "@/utils/query.js"
export default {
    action: '获取系统用户列表',
    logType: 'GET_SYSTEM_USER_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { username, nickname, pageIndex = 1, pageSize = 10 } = ctx.request.query
        const query = {};
        if (username) query.username = { $like: `%${username}%` };
        if (nickname) query.nickname = { $like: `%${nickname}%` };
        const page = paginate(pageIndex, pageSize)
        const [list, total] = await Promise.all([
            userModel.findMany({ ...query, ...NORMAL_ENABLED_USER_QUERY }, { ...page, sort: { createdAt: 'desc' }, fields: ['id', 'username', 'nickname', 'email', 'phone', 'createdAt', 'updatedAt', 'avatar'] }),
            userModel.count({ query: { ...query, ...NORMAL_ENABLED_USER_QUERY } })
        ])
        ctx.success({
            list,
            total
        });
    },
}