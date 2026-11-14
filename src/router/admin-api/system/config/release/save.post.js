

import systemConfigModel from '@/database/model/system/config.js';

export default {
    action: '设置系统基础配置',
    logType: 'SET_SITE_CONFIG',
    /** @type {Controller} */
    handler: async (ctx) => {

        const { appUrl, appVersion, appDescription } = ctx.request.body;
        const reg = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
        if (!reg.test(appVersion)) {
            ctx.fail("版本号格式必须为 x.x.x，例如 1.1.1")
            return
        }
        $validate(appUrl, "安卓文件不能为空");
        $validate(appVersion, "app版本号不能为空");
        $validate(appDescription, "app发布描述不能为空");

        await systemConfigModel.insertMany([
            {
                configKey: 'appUrl',
                configValue: appUrl.id
            },
            {
                configKey: 'appVersion',
                configValue: appVersion
            },
            {
                configKey: 'appDescription',
                configValue: appDescription
            }
        ], {
            upsert: ['configValue']
        })

        ctx.success();
    },
}