
import routeModel from "@/database/model/system/menu.js"
import { roleModel, rolePermissionModel } from "@/database/model/system/role.js"
import { userRoleModel } from "@/database/model/system/user.js"

export default {
    action: '获取系统首页快捷导航',
    logType: 'GET_SYSTEM_QUICK_NAVS',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {

        const userId = ctx.user.userId
        const isSuperAdmin = ctx.user.isSuperAdmin
        let joins = []

        if (!isSuperAdmin) {
            joins = [{
                table: userRoleModel.table,
                as: "userRole",
                on: {
                    "userRole.userId": { $eq: userId },
                }
            },
            {
                table: rolePermissionModel.table,
                as: "rolePer",
                on: {
                    "rolePer.roleId": "userRole.roleId",
                    [routeModel.qualifyField("id")]: "rolePer.routeId"
                }
            }]
        }

        const result = await routeModel.aggregate({
            query: {
                [routeModel.qualifyField("enabled")]: 1,
                [routeModel.qualifyField("isHome")]: 1,
                [routeModel.qualifyField("type")]: 1,
            },  
            fields: routeModel.qualifyFields(),
            joins,
            limit:8
        });

        ctx.success(result)
    },
}

