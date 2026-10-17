
import userModel from "@/database/model/system/user.js"
import { NORMAL_ENABLED_USER_QUERY } from "@/utils/query.js"


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
            query: { "user_dept.deptId": { $eq: null }, ...query, ...NORMAL_ENABLED_USER_QUERY },
            joins: [{
                table: "user_dept",
                type: "left",
                as: "user_dept",
                on: { "system_user.id": "user_dept.userId", "user_dept.deptId": { $eq: deptId } },
            }]
        }

        const fields = userModel.qualifyFields(["id", "avatar", "username", "nickname", "email", "phone"])
        fields.push("user_dept.deptId")
        const aggregate = userModel.aggregate({
            fields: fields,
            ...aggregateParams,
            sort: { "system_user.createdAt": "desc" },
            ...page
        })
        const totalAggregate = userModel.aggregate({
            ...aggregateParams,
            fields: fields[0]
        })
        const [list, total] = await Promise.all([aggregate, totalAggregate])
        ctx.success({
            list: list,
            total: total.length
        });
    },
}