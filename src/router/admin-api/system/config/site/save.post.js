

import systemConfigModel from '@/database/model/system/config.js';

export default {
    action: '设置系统基础配置',
    logType: 'SET_SITE_CONFIG',
    /** @type {Controller} */
    handler: async (ctx) => {
        const { logo, systemTitle, copyrightCompany, copyrightYear, icpNumber, icpLink, policeNumber, policeLink } = ctx.request.body;
        $validate(logo, "logo不能为空");
        $validate(systemTitle, "系统标题不能为空");
        await systemConfigModel.insertMany([
            {
                configKey: 'site_logo',
                configValue: logo.id
            },
            {
                configKey: 'site_systemTitle',
                configValue: systemTitle
            },
            {
                configKey: 'site_copyrightCompany',
                configValue: copyrightCompany
            },
            {
                configKey: 'site_copyrightYear',
                configValue: copyrightYear
            },
            {
                configKey: 'site_icpNumber',
                configValue: icpNumber
            },
            {
                configKey: 'site_icpLink',
                configValue: icpLink
            },
            {
                configKey: 'site_policeNumber',
                configValue: policeNumber
            },
            {
                configKey: 'site_policeLink',
                configValue: policeLink
            }
        ], {
            upsert: ['configValue']
        })

        ctx.success();
    },
}