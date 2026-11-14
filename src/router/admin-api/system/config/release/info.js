import systemConfigModel from '@/database/model/system/config.js';
import uploadModel from "@/database/model/upload.js";

export default {
    action: '获取基本配置',
    logType: 'GET_SITE_CONFIG',
    auth: false,
    enableLog: false,
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
                select: [
                    {
                        type: "jsonObject",
                        alias: "appUrl",
                        fields: { "url": "upload.url", id: "upload.id" }
                    }
                ]
            },]
        })


        const map = new Map(config.map((item) => [item.configKey, item.appUrl || item.configValue]));
        ctx.success({
            appUrl: map.get("appUrl") || '',
            appVersion: map.get("appVersion") || '',
            appDescription: map.get("appDescription") || ''
        });
    },
}