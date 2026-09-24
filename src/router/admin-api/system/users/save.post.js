import userModel, { userRoleModel, userDeptModel } from "@/database/model/user/index.js"

export default {
    action: '系统用户注册/编辑',
    logType: 'SYSTEM_USER_REGISTER',
    /** @type {Controller} */
    handler: async (ctx) => {
        let { id: userId, username, password, email, nickname, avatar = "", phone, roleIds = [], deptIds = [], enabled = 1 } = ctx.request.body;

        $validate(username, "账号不能为空");
        $validate(nickname, "昵称不能为空");
        $validateArray(roleIds, "角色不能为空");

        if (username.length < 10 || username.length > 15) {
            return ctx.fail("账号长度不能小于10位并且不能大于15位");
        }

        if (!userId && !password) {
            password = "12345678";
        }

        if (!Array.isArray(deptIds) || deptIds.every(id => typeof id !== 'number')) {
            return ctx.fail("部门ID格式不正确");
        }

        if (password && (password.length < 8 || password.length > 16)) {
            return ctx.fail("密码长度不能小于8位并且不能大于16位");
        }


        const user = await userModel.findOne({ username });

        if (user && user.id !== userId) {
            return ctx.fail("该账号已被使用请重新输入");
        }

        const result = await userModel.withTransaction(async (model) => {
            const params = { username, email, nickname, avatar, phone, enabled };
            if (password) params.password = password;

            const result = userId ? await model.updateOne({ id: userId }, params) : await model.insertOne(params);

            // 新增用户，获取插入后的 ID
            if (!userId) {
                userId = result.insertId;
            }

            // 编辑用户时，获取原来的角色和部门
            let oldRoleIds = [];
            let oldDeptIds = [];

            if (result && userId) {
                const where = { userId };

                const [userRoles, userDepts] = await Promise.all([
                    userRoleModel.findMany(where),
                    userDeptModel.findMany(where)
                ]);

                oldRoleIds = userRoles.map(item => item.roleId);
                oldDeptIds = userDepts.map(item => item.deptId);
            }

            // =========================
            // 角色
            // =========================
            await syncRelation({
                model: userRoleModel,
                userId,
                oldIds: oldRoleIds,
                newIds: roleIds,
                field: 'roleId'
            });


            // =========================
            // 部门
            // =========================
            await syncRelation({
                model: userDeptModel,
                userId,
                oldIds: oldDeptIds,
                newIds: deptIds,
                field: 'deptId'
            });

            return result;
        });
        ctx.success();
    }
}


async function syncRelation({
    model,
    userId,
    oldIds,
    newIds,
    field
}) {
    // 找出需要删除的ID
    const delIds = oldIds.filter(id => !newIds.includes(id));
    // 找出需要添加的ID
    const addIds = newIds.filter(id => !oldIds.includes(id));

    if (delIds.length > 0) {
        await model.deleteMany({ userId, [field]: { $in: delIds } });
    }

    if (addIds.length > 0) {
        await model.insertMany(
            addIds.map(id => ({ userId, [field]: id }))
        );
    }
}