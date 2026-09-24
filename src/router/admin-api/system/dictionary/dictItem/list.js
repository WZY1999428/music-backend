import { dictItemModel } from "@/database/model/system/dictionary.js"

export default {
    action: '获取字典内容列表',
    logType: 'GET_DICT_ITEM_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { dictId, title = "", pageIndex, pageSize } = ctx.request.query;
        $validate(dictId, "字典类型Id不能为空");
        const query = { dictId: { $eq: dictId } }
        if (title && title.trim()) query.title = { $like: `%${title.trim()}%` }
        const page = paginate(pageIndex, pageSize);
        const result = await dictItemModel.findMany(query, { ...page, sort: { sort: "asc" } });
        ctx.success({
            list: result,
            total: await dictItemModel.count({query})
        });
    },
}