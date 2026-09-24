import systemConfigModel from '@/database/model/system/config.js';
import uploadModel from "@/database/model/upload.js";

export default {
    action: '获取基本配置',
    logType: 'GET_SITE_CONFIG',
    auth: false,
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const config = await systemConfigModel.findMany({
            configKey: {
                $in: [
                    'site_logo',
                    'site_systemTitle',
                    'site_copyrightCompany',
                    'site_copyrightYear',
                    'site_icpNumber',
                    'site_icpLink',
                    'site_policeNumber',
                    'site_policeLink'
                ]
            }
        });

        const map = new Map(config.map((item) => [item.configKey, item.configValue]));

        const logoId = map.get('site_logo');
        const logo = logoId ? (await uploadModel.findOne({ id: logoId })) : null
        ctx.success({
            logo: logo ? { id: logo.id, url: logo.url } : null,
            systemTitle: map.get('site_systemTitle') || '',
            copyrightCompany: map.get('site_copyrightCompany') || '',
            copyrightYear: map.get('site_copyrightYear') || '',
            icpNumber: map.get('site_icpNumber') || '',
            icpLink: map.get('site_icpLink') || '',
            policeNumber: map.get('site_policeNumber') || '',
            policeLink: map.get('site_policeLink') || ''
        });
    },
}