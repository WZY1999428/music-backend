import deptModel from "@/database/model/system/dept.js"

export default {
    action: '编辑/新增部门',
    logType: 'EDIT_DEPT',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id, parentId, deptName, leaderId, phone, email, remark, enabled = true } = ctx.request.body;
        $validate(deptName, "部门名称不能为空");
        if (email) {
            $validateEmail(email, "邮箱格式不正确");
        }

        $validatePhone(phone, "部门手机号不正确");

        $validate(leaderId, "部门负责人不能为空");


        if (parentId) {
            if (parentId == id) return ctx.fail("父级部门不能为自己");
            const allDepts = await deptModel.findMany({});
            if (!allDepts.some(dept => dept.id == parentId)) return ctx.fail("父级部门不存在请重新选择");
            const descendantIds = getDescendantIds(allDepts, id);
            if (descendantIds.has(Number(parentId))) {
                return ctx.fail("上级部门不能选择自己的下级部门");
            }
        }

        const params = { parentId, deptName, leaderId, phone, email, remark, enabled };
        try {
            id ? await deptModel.updateOne({ id }, params) : await deptModel.insertOne(params)
            ctx.success(null, id ? "更新成功" : "添加成功")
        } catch (error) {
            if (error.code == "ER_DUP_ENTRY") return ctx.fail("部门名称已存在")
            ctx.fail(error.message)
        }
    },
}