import systemConfigModel from '@/database/model/system/config.js';
import uploadModel from "@/database/model/upload.js";

export default {
    action: '获取配置',
    logType: 'GET_CONFIG',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const config = await systemConfigModel.findMany();
        const map = new Map(config.map((item) => [item.configKey, item.configValue]));
        const logoId = map.get('site_logo');
        const logo = logoId ? (await uploadModel.findOne({ id: logoId })) : null
        const info = {
            logo: logo?.url,
            systemTitle: map.get('site_systemTitle') || '',
            copyrightCompany: map.get('site_copyrightCompany') || '',
            copyrightYear: map.get('site_copyrightYear') || '',
            icpNumber: map.get('site_icpNumber') || '',
            icpLink: map.get('site_icpLink') || '',
            policeNumber: map.get('site_policeNumber') || '',
            policeLink: map.get('site_policeLink') || ''
        };

        if (ctx.user && ctx.user.userId) {

        }
        ctx.success(info);
    },
}

