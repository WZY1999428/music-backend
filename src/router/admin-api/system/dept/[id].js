import deptModel from "@/database/model/system/dept.js"

export default {
    action: '获取部门信息',
    logType: 'GET_DEPT_INFO',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.params;
        const dept = await deptModel.findOne({ id })
        if (!dept) return ctx.fail("部门不存在")
        ctx.success(dept)
    },
}