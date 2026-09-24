import announceMgmtModel from "@/database/model/contentMgmt/announceMgmt.js";

export default {
    action: '删除公告',
    logType: 'DELETE_CONTENT_MGMT_ANNOUNCE_MGMT',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "id不能为空")
        const result = await announceMgmtModel.deleteOne({ id })
        if (result.affectedRows === 0) {
            ctx.fail("公告不存在");
            return;
        }
        ctx.success(null, "删除成功");
    },
}