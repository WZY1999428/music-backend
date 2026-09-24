import routeModel, { menuPermissionsModel, apiModel } from "@/database/model/system/menu.js";
export default {
    action: '保存菜单权限按钮',
    logType: 'SAVE_MENU_PERMISSION',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { id, routeId, name, permission, apiList = [] } = ctx.request.body;

        $validate(routeId, "路由id不能为空")
        $validate(name, "权限名称不能为空")
        $validate(permission, "权限标识不能为空")

        $validate(await routeModel.findOne({ id: routeId }), "路由不存在")

        const params = { routeId, name, permission }
        let result
        try {
            result = await menuPermissionsModel.withTransaction(async (model) => {
                const result = id ? await model.updateOne({ id }, params) : await model.insertOne(params)

                const apiListData = apiList.map(str => {
                    const [method, ...rest] = str.split(" : ");
                    return { method: method.trim(), path: rest.join(":").trim() };
                })

                if (result.insertId) {
                    if (apiListData.length > 0) {
                        await apiModel.insertMany(apiListData.map(({ method, path }) => ({ method, path, permissionsId: result.insertId })))
                    }
                } else {
                    const apis = await apiModel.findMany({ permissionsId: id })
                    // 找出需要删除的记录 ID（数据库有，但前端没传的）
                    const delIds = apis.filter(api => !apiListData.some(item => item.method === api.method && item.path === api.path)).map(api => api.id)
                    // 找出需要新增的记录（前端有，但数据库没有的）
                    const addApis = apiListData.filter(item => !apis.some(api => api.method === item.method && api.path === item.path))
                    // 执行数据库并发更新
                    const tasks = [];
                    if (delIds.length) tasks.push(apiModel.deleteMany({ id: { $in: delIds } }))
                    if (addApis.length) tasks.push(apiModel.insertMany(addApis.map(({ method, path }) => ({ method, path, permissionsId: id }))))
                    if (tasks.length) await Promise.all(tasks)
                }
                return result;
            })
            ctx.success(null, id ? "更新成功" : "添加成功")
        } catch (error) {
            if (id && result?.affectedRows == 0) return ctx.fail("更新失败，数据不存在")
            if (result?.code == "ER_DUP_ENTRY") return ctx.fail("字典名称已存在")
            ctx.success(null, id ? "更新成功" : "添加成功")
        }
    }
}