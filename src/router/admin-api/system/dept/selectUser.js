
import userModel from "@/database/model/user/index.js"


export default {
    action: '获取选择部门成员',
    logType: 'GET_DEPT_USERS',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { deptId, username, nickname, pageIndex = 1, pageSize = 10 } = ctx.request.query
        $validate(deptId, '部门id不能为空')

        const query = {};
        if (username && username.trim()) query.username = { $eq: username.trim() }
        if (nickname && nickname.trim()) query.nickname = { $eq: username.trim() }

        const page = paginate(pageIndex, pageSize)
        const aggregateParams = {
            query: { "user_dept.deptId": { $eq: null }, ...query, "system_user.enabled": { $eq: 1 } },
            joins: [{
                table: "user_dept",
                type: "left",
                as: "user_dept",
                on: { "system_user.id": "user_dept.userId", "user_dept.deptId": { $eq: deptId } },
            }]
        }

        const aggregate = userModel.aggregate({
            fields: [
                "system_user.id",
                "system_user.avatar",
                "system_user.username",
                "system_user.nickname",
                "system_user.email",
                "system_user.phone",
                "user_dept.deptId",
            ],
            ...aggregateParams,
            sort: { "system_user.createdAt": "desc" },
            ...page
        })
        const totalAggregate = userModel.aggregate({
            ...aggregateParams,
            fields: ["system_user.id"]
        })
        const [list, total] = await Promise.all([aggregate, totalAggregate])
        ctx.success({
            list: list,
            total: total.length
        });
    },
}