export default {
    action: '获取日志列表',
    logType: 'GET_LOG_LIST',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        const dictType = await dictTypeModel.findOne({ id })
        if (!dictType) return ctx.fail("字典类型不存在")
        ctx.success(dictType)
    },
}