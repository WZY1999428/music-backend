

const SYSTEM_START_TIME = Date.now();
export default {
    action: '获取系统首页信息',
    logType: 'GET_SYSTEM_INFO',
    enableLog: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        // 系统运行时间
        const uptime = Date.now() - SYSTEM_START_TIME;

        ctx.success({
            systemUptime: formatUptime(uptime).formatted
        });
    },
}


function formatUptime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    // 粗略按：1年 = 365天，1个月 = 30天
    const years = Math.floor(totalDays / 365);
    const remainingDaysAfterYears = totalDays % 365;
    const months = Math.floor(remainingDaysAfterYears / 30);
    const days = remainingDaysAfterYears % 30;

    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;

    // 拼接人类可读的字符串
    let formattedStr = '';
    if (years > 0) formattedStr += `${years}年`;
    if (months > 0 || years > 0) formattedStr += `${months}个月`;
    if (days > 0 || months > 0 || years > 0) formattedStr += `${days}天`;
    if (hours > 0 || days > 0 || months > 0 || years > 0) formattedStr += `${hours}小时`;
    formattedStr += `${minutes}分钟`;

    return {
        formatted: formattedStr, // 例如："1年2个月5天3小时12分钟"
        details: {
            years,
            months,
            days,
            hours,
            minutes,
            totalDays, // 如果你还需要单纯的总天数
        }
    };
}