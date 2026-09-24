import agreementsModel from "@/database/model/contentMgmt/agreements.js";
export default {
    action: '保存协议',
    logType: 'SAVE_CONTENT_MGMT_AGREEMENTS',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id, title, code, content, enabled = 1 } = ctx.request.body;

        const createUserId = ctx.user.userId;
        $validate(title, "协议标题不能为空")
        $validate(code, "协议编码不能为空")
        $validate(content, "协议内容不能为空")
        try {
            const params = { title, code, content, enabled, createUserId }
            id ? await agreementsModel.updateOne({ id }, params) : await agreementsModel.insertOne(params)
            ctx.success(null, id ? "更新成功" : "添加成功")
        } catch (error) {
            if (error.code == "ER_DUP_ENTRY") return ctx.fail("协议编号已存在")
            ctx.fail(error.message)
        }
    },
}