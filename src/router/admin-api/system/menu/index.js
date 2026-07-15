const routeModel = require("@/database/system/menu.js")

module.exports = async (ctx) => {
    const { pageIndex = 1, pageSize = 20, name, path } = ctx.request.query
    const result = await routeModel.findMany({
        name: { $like: `%${name}%` },
        path: { $like: `%${path}%` }
    }, {
        limit: pageSize,
        offset: (pageIndex - 1) * pageSize
    })

    ctx.success(result)

}