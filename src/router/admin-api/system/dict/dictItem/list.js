import { dictItemModel } from "@/database/model/system/dictionary.js"

export default {
    action: '获取字典内容列表',
    logType: 'GET_DICT_ITEM_LIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { dictId, name = "", pageIndex, pageSize } = ctx.request.query;
        $validate(dictId, "字典类型Id不能为空");
        const query = { parentId: { $eq: dictId } }
        if (name && name.trim()) query.name = { $like: `%${name.trim()}%` }
        const result = await dictItemModel.findMany(query, paginate(pageIndex, pageSize));
        ctx.success(result);
    },
}