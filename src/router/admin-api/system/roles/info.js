import { roleModel } from "@/database/model/system/role.js"

export default {
    action: '获取角色信息',
    logType: 'GET_ROLE_INFO',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id } = ctx.request.query;
        $validate(id, "角色id不能为空");
        const roleinfo = await roleModel.findOne({ id })
        $validate(roleinfo, "角色不存在")
        ctx.success(roleinfo, "获取信息成功");
    },
}