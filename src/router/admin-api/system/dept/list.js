import deptModel from "@/database/model/system/dept.js"
import { countRootNodes, listToTree } from "@/utils/tree.js"

export default {
    action: '获取部门列表',
    logType: 'GET_DEPT_LIST',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { deptName = "", leaderId = "", pageIndex, pageSize } = ctx.request.query;
        const query = {}
        if (deptName && deptName.trim()) query.deptName = { $like: `%${deptName.trim()}%` }
        if (leaderId) query.leaderId = { $eq: leaderId };

        let queryLen = Object.keys(query).length;

        const page = paginate(pageIndex, pageSize)

        const aggregate = deptModel.aggregate({
            query,
            fields: [
                "system_dept.id",
                "system_dept.parentId",
                "system_dept.deptName",
                "system_dept.leaderId",
                "system_dept.phone",
                "system_dept.email",
                "system_dept.remark",
                "system_dept.createdAt",
                "system_dept.updatedAt",
                "userDept.nickname as leaderName",
            ],
            joins: [{
                table: "system_user",
                type: "left",
                as: "userDept",
                on: { "userDept.id": "system_dept.leaderId" },
            }],
            group: ["system_dept.id"],
            sort: { "system_dept.createdAt": "desc" },
            ...page
        })

        const [list, total] = await Promise.all([
            aggregate,
            queryLen > 0 ? countRootNodes(await deptModel.findMany({ query, fields: ["id", "parentId"] })) : deptModel.count({ query: { ...query, parentId: { $eq: null } } })
        ])
        const tree = listToTree(list);
        ctx.success({
            list: tree,
            total: total,
        });
    },
}