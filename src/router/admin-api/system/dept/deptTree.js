import deptModel from "@/database/model/system/dept.js"

export default {
    action: '获取部门树',
    logType: 'GET_DEPT_TREE',
    /** @type {Controller} */
    handler: async (ctx) => {
        const deptList = await deptModel.findMany({
            enabled: { $eq: 1 }
        }, { sort: { createdAt: 'desc' } });
        const list = deptList.map(item => ({ value: item.id, label: item.deptName, parentId: item.parentId }))

        ctx.success(listToTree(list, 'value'));
    },
}

