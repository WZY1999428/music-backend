import agreementsModel from "@/database/model/contentMgmt/agreements.js";

export default {
    action: '删除协议列表',
    logType: 'DELETE_CONTENT_MGMT_AGREEMENTS',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "id不能为空")
        const result = await agreementsModel.deleteOne({ id })
        if (result.affectedRows === 0) {
            ctx.fail("协议不存在");
            return;
        }
        ctx.success(null, "删除成功");
    },
}