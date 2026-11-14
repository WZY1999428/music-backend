import announceMgmtModel from "@/database/model/contentMgmt/announceMgmt.js"
export default {
    action: '获取系统公告',
    logType: 'GET_SYSTEM_NOTICE',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const result = await announceMgmtModel.findMany({ enabled: 1 }, {
            limit: 5
        })
        ctx.success(result);
    },
}