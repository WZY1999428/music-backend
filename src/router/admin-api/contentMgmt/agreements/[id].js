import agreementsModel from "@/database/model/contentMgmt/agreements.js";

export default {
    action: '获取协议详情',
    enableLog: false,
    logType: 'GET_CONTENT_MGMT_AGREEMENTS_DETAIL',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        const agreement = await agreementsModel.findOne({ id })
        if (!agreement) return ctx.fail("协议不存在")
        ctx.success(agreement)
    },
}

