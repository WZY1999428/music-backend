import systemConfigModel from '@/database/model/system/config.js';
import uploadModel from "@/database/model/upload.js";
export default {
    action: '下载安卓应用',
    logType: 'DOWNLOAD_ANDORID_APP',
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const config = await systemConfigModel.aggregate({
            query: { configKey: 'appUrl' },
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
            },],
            limit: 1
        })
        if (!config.length) {
            ctx.notFound()
        } else {
            ctx.redirect(config[0].url)
        }
    },
}