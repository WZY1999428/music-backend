import { dictTypeModel } from "@/database/model/system/dictionary.js"

/** @type {Controller} */
export default async (ctx) => {
    const { name = "", code, pageIndex, pageSize } = ctx.request.query;
    const query = {}
    if (name && name.trim()) query.name = { $like: `%${name.trim()}%` }
    if (code) query.code = { $eq: code };
    const result = await dictTypeModel.findMany(query, paginate(pageIndex, pageSize));
    ctx.success(result);
}