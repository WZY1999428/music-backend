import systemConfigModel from '@/database/model/system/config.js';
import uploadModel from "@/database/model/upload.js";
export default {
    action: '获取app版本信息',
    logType: 'GET_APP_VERSION',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const config = await systemConfigModel.aggregate({
            query: {
                configKey: {
                    $in: [
                        'appUrl',
                        'appVersion',
                        "appDescription"
                    ]
                }
            },
            joins: [{
                table: uploadModel.table,
                as: "upload",
                type: "left",
                on: {
                    "upload.id": systemConfigModel.qualifyField("configValue")
                },
                select: [{ type: "raw", fields: { "appUrl": "upload.url" } }]
            },]
        })
        const map = new Map(config.map((item) => [item.configKey, item.appUrl || item.configValue]));
        ctx.success({
            appVersion: map.get("appVersion") || '',
            appDescription: map.get("appDescription") || ''
        });
    },
}