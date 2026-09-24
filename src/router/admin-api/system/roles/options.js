import { roleModel } from "@/database/model/system/role.js"

export default {
    action: '获取角色选项',
    logType: 'GET_ROLES_OPTIONS',
    /** @type {Controller} */
    handler: async (ctx) => {
        const options = await roleModel.findMany({ enabled: { $eq: 1 } });
        ctx.success(options.map((item) => ({ label: item.name, value: item.id })));
    },
}