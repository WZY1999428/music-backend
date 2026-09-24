import announceMgmtModel from "@/database/model/contentMgmt/announceMgmt.js";

export default {
    action: '获取公告详情',
    enableLog: false,
    logType: 'GET_CONTENT_MGMT_ANNOUNCE_MGMT',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        const announce = await announceMgmtModel.findOne({ id })
        if (!announce) return ctx.fail("公告不存在")
        ctx.success(announce)
    },
}

