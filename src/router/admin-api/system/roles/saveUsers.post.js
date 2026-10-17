
import { roleModel, } from "@/database/model/system/role.js"
import userModel, { userRoleModel } from "@/database/model/system/user.js"

export default {
    action: '保存角色成员',
    logType: 'SAVE_ROLE_USERS',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id: roleId, userIds } = ctx.request.body;

        $validate(roleId, "角色id不能为空");
        $validate(Array.isArray(userIds), "用户id不能为空");
        $validate(userIds, "用户id不能为空");
        const role = await roleModel.findOne({ id: roleId });
        if (!role) return ctx.fail("角色不存在");


        const result = await userRoleModel.withTransaction(async (model) => {

            const userIdSet = new Set(userIds);
            const currentUsers = await model.findMany({ roleId });

            const currentUserIds = new Set(currentUsers.map(item => item.userId));
            // 删除
            const removeUserIds = currentUsers.map(item => item.userId).filter(userId => !userIdSet.has(userId));
            if (removeUserIds.length) {
                const userRoles = await model.findMany({ userId: { $in: removeUserIds } });
                const userRoleMap = new Map();

                for (const item of userRoles) {
                    const roles = userRoleMap.get(item.userId) ?? [];
                    roles.push(item);
                    userRoleMap.set(item.userId, roles);
                }

                const onlyRoleUserIds = removeUserIds.filter(userId => (userRoleMap.get(userId) ?? []).length == 1);
                if (onlyRoleUserIds.length > 0) {
                    const users = await userModel.findMany({ id: { $in: onlyRoleUserIds } }, { fields: ["nickName"] });
                    const nickNames = users.map(user => user.nickName);
                    return new Error(`以下用户仅有一个角色，无法移除当前角色：${nickNames.join("、")}`);
                }

                // 只有一个角色的用户不能移除当前角色
                const canRemoveUserIds = removeUserIds.filter(userId => (userRoleMap.get(userId) ?? []).length > 1);

                if (canRemoveUserIds.length > 0) {
                    await userRoleModel.deleteMany({ roleId, userId: { $in: canRemoveUserIds } });
                }
            }
            // 新增
            const addUserIds = userIds.filter(userId => !currentUserIds.has(userId));
            if (addUserIds.length) {
                await userRoleModel.insertMany(addUserIds.map(userId => ({ roleId, userId })));
            }

        })

        if (!result) {
            ctx.success();
        } else {
            ctx.fail(result.message);
        }
    },
}