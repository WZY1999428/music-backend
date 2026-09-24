import announceMgmtModel from "@/database/model/contentMgmt/announceMgmt.js";
export default {
    action: '保存公告',
    logType: 'SAVE_CONTENT_MGMT_ANNOUNCE_MGMT',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id, title, type, sort, dateRange, content, enabled = 1 } = ctx.request.body;
        $validate(title, "公告名称不能为空")
        $validate(type, "公告类型不能为空")
        $validate(content, "公告内容不能为空")

        let startTime = "";
        let endTime = "";
        if (dateRange && dateRange.length === 2) {
            const range = toDateTimeRange(dateRange)
            startTime = range[0];
            endTime = range[1];
        }

        try {
            const params = { title, type, sort, startTime, endTime, content, enabled, createUserId: ctx.user.userId }
            id ? await announceMgmtModel.updateOne({ id }, params) : await announceMgmtModel.insertOne(params)
            ctx.success(null, id ? "更新成功" : "添加成功")
        } catch (error) {
            if (error.code == "ER_DUP_ENTRY") return ctx.fail("公告名称已存在")
            ctx.fail(error.message)
        }
    },
}