
import { userRoleModel } from "@/database/model/system/user.js"
import { roleModel } from "@/database/model/system/role.js"
export default {
     action: '切换用户角色',
     logType: 'SWITCH_USER_ROLE',
     /** @type {Controller} */
     handler: async (ctx) => {
          const { roleId } = ctx.request.body;
          $validate(roleId, "角色ID不能为空");
          $validate(await userRoleModel.findOne({ roleId: roleId, userId: ctx.user.userId }), "切换失败，用户角色不存在");
          const user = { ...ctx.user };
          const role = await roleModel.findOne({ id: roleId })
          user.roleId = roleId;
          user.roleName = role?.name || null;
          await valkey.setToken(ctx.token, user, "EX", process.env.JWT_EXPIRE);
          ctx.success(null, "切换成功");
     },
}