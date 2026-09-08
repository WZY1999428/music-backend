
import { roleModel } from "@/database/model/permission/role.js"

/** @type {Controller} */
export default async (ctx) => {
    const { name = null, pageIndex = 1, pageSize = 20 } = ctx.request.query;
    const query = {}
    if (name && name.trim()) query.name = { $like: `%${name}%` }
    const list = await roleModel.findMany(query, paginate(pageIndex, pageSize))
    ctx.success(list)
}



