import { userDeptModel } from "@/database/model/system/user.js"

export default {
    action: '获取部门成员',
    logType: 'GET_DEPT_USERS',
    enableLog:false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { deptId } = ctx.request.query
        $validate(deptId, '部门id不能为空')
        const { pageIndex = 1, pageSize = 10 } = ctx.request.query
        const page = paginate(pageIndex, pageSize)

        const aggregateParams = {
            query: { deptId: { $eq: deptId }, "system_user.enabled": { $eq: 1 } },
            joins: [{
                table: "system_user",
                type: "left",
                as: "system_user",
                on: { "system_user.id": "user_dept.userId" },
            }],
        }

        const aggregate = userDeptModel.aggregate({
            fields: [
                "system_user.id",
                "system_user.avatar",
                "system_user.username",
                "system_user.nickname",
                "system_user.email",
                "system_user.phone",
                "user_dept.deptId",
                "system_user.enabled"
            ],
            ...aggregateParams,
            sort: { "user_dept.createdAt": "desc" },
            ...page
        })

        const [list, total] = await Promise.all([
            aggregate,
            userDeptModel.aggregate({ fields: ["system_user.id"], ...aggregateParams })
        ])
        ctx.success({
            list: list.filter(i => i.enabled == 1),
            total: total.length
        });
    },
}