import routeModel, { menuPermissionsModel } from "@/database/model/system/menu.js";
/** @type {Controller} */
export default async (ctx) => {
    let {
        id = 0,
        parentId = 0,
        title,
        type = 1,
        icon = null,
        path = null,
        component = null,
        sort = 0,
        isLink = false,
        enabled = false,
        menuButtons = []
    } = ctx.request.body;
    $validate(title, "名称不能为空");

    if (type == 2) { // 菜单
        $validate(component, "组件地址不能为空")
        $validate(path, "路由地址不能为空")
    }

    if (parentId != 0) {
        const parent = await routeModel.findOne({ id: parentId });
        if (!parent) return ctx.fail("父级菜单不存在请重新选择");
    }

    const exists = await routeModel.findOne({ title, path });

    if (exists) return ctx.fail(`已存在相同的 名称：${title}  路径：${path}`);

    const params = { parentId, title, icon, path, component, sort, isLink, enabled, type }

    const message = await routeModel.withTransaction(async (model) => {
        let msg = ""
        if (id) {
            const new_btns = menuButtons.filter(item => !item.id);
            if (Array.isArray(new_btns) && new_btns.length) {
                await menuPermissionsModel.insertMany(buildBtns(new_btns, id))
            }
            let update_btns = menuButtons.filter(item => item.id);
            if (Array.isArray(update_btns) && update_btns.length) {
                update_btns = buildBtns(update_btns, id)
                for (const btn of update_btns) await menuPermissionsModel.update({ id: btn.id }, btn)
            }
            await model.update({ id }, params)
            msg = "更新成功"
        } else {
            const result = await model.insert(params)
            console.log(menuButtons);
            if (Array.isArray(menuButtons) && menuButtons.length) {
                await menuPermissionsModel.insertMany(buildBtns(menuButtons, result.insertId))
                msg = "添加成功"
            }
        }
        return msg
    })
    ctx.success(null, message);
}

function buildBtns(menuButtons, menuId) {
    return menuButtons.map(m => ({ name: m.name, permission: m.permission, sort: m.sort, enabled: m.enabled, menuId }));
}