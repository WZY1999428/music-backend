import routeModel, { menuPermissionsModel } from "@/database/model/system/menu.js";
export default {
    action: '编辑/新增菜单',
    logType: 'EDIT_MENU',
    /** @type {Controller} */
    handler: async (ctx) => {
        let {
            id,
            parentId = 0,
            title,
            type = 1,
            icon = null,
            path = null,
            component = null,
            sort = 0,
            isLink = 0,
            enabled = 1,
            visible = 1,
            permissions = []
        } = ctx.request.body;

        $validate(title, "名称不能为空");
        $validate(path, "路由地址不能为空")

        if (type == 2 && isLink === 0) { // 菜单
            $validate(component, "组件地址不能为空")
        }

        if (!parentId) parentId = 0;


        if (parentId) {
            if (parentId == id) return ctx.fail("父级菜单不能为自己");
            const allMenus = await routeModel.findMany({});
            if (!allMenus.some(menu => menu.id == parentId)) return ctx.fail("父级菜单不存在请重新选择");
            const descendantIds = getDescendantIds(allMenus, id);
            if (descendantIds.has(Number(parentId))) {
                return ctx.fail("上级菜单不能选择自己的下级菜单");
            }
        }


        const exists = await routeModel.findOne({ title, path });

        if (exists && !id) return ctx.fail(`已存在相同的 名称：${title}  路径：${path}`);

        const params = { parentId, title, icon, path, component, sort, isLink, enabled, type, visible }
        try {
            const message = await routeModel.withTransaction(async (model) => {
                let msg = ""
                if (id) {
                    const new_btns = permissions.filter(item => !item.id);
                    if (Array.isArray(new_btns) && new_btns.length) {
                        await menuPermissionsModel.insertMany(buildBtns(new_btns, id))
                    }

                    let update_btns = permissions.filter(item => item.id);
                    if (Array.isArray(update_btns) && update_btns.length) {
                        update_btns = buildBtns(update_btns, id)
                        for (const btn of update_btns) {
                            await menuPermissionsModel.updateOne({ id: btn.id }, btn)
                        }
                    }
                    await model.updateOne({ id }, params)
                    msg = "更新成功"
                } else {
                    const result = await model.insertOne(params)
                    if (Array.isArray(permissions) && permissions.length) {
                        await menuPermissionsModel.insertMany(buildBtns(permissions, result.insertId))
                    }
                    msg = "添加成功"
                }
                return msg
            })
            ctx.success(null, message);
        } catch (error) {
            if (error.message.includes('menus.uk_parentIdSort')) {
                return ctx.fail('该父级菜单下的排序值已存在');
            }
            ctx.fail(error.message);
        }
    },
}

function buildBtns(permissions, routeId) {
    return permissions.map(m => {
        const obj = { name: m.name, permission: m.permission, sort: m.sort, enabled: m.enabled, routeId };
        if (m.id) obj.id = m.id;
        return obj;
    });
}