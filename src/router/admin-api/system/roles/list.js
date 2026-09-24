
import { roleModel } from "@/database/model/system/role.js"

export default {
    action: '获取角色列表',
    logType: 'GET_ROLE_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { name = null, pageIndex = 1, pageSize = 20 } = ctx.request.query;
        const query = {}
        if (name && name.trim()) query.name = { $like: `%${name}%` }
        const page = paginate(pageIndex, pageSize)

        const [list, total] = await Promise.all([
            roleModel.findMany(query, { ...page, sort: { createdAt: 'desc' } }),
            roleModel.count({ query })
        ])
        ctx.success({
            list,
            total
        })
    },
}
