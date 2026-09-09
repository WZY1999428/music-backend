
import { roleModel } from "@/database/model/permission/role.js"

export default {
    action: '获取角色列表',
    logType: 'GET_ROLE_LIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { name = null, pageIndex = 1, pageSize = 20 } = ctx.request.query;
        const query = {}
        if (name && name.trim()) query.name = { $like: `%${name}%` }
        const list = await roleModel.findMany(query, paginate(pageIndex, pageSize))
        ctx.success(list)
    },
}
