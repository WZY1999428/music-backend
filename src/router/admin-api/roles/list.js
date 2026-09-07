
import { roleModel } from "@/database/model/permission/role.js"

/** @type {Controller} */
export default async (ctx) => {
    const { name, pageInde = 1, pageSize = 20 } = ctx.request.body;
    const query = {}
    if (name) query.$like = `%${name}%`
    const list = await roleModel.findMany(query,{})

    ctx.success("123123")
}



