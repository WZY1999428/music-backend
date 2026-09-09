import { dictTypeModel } from "@/database/model/system/dictionary.js"

export default {
    action: '获取字典列表',
    logType: 'GET_DICT_LIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { title = "", code, pageIndex, pageSize } = ctx.request.query;
        const query = {}
        if (title && title.trim()) query.title = { $like: `%${title.trim()}%` }
        if (code) query.code = { $eq: code };
        const result = await dictTypeModel.findMany(query, paginate(pageIndex, pageSize));
        ctx.success(result);
    },
}