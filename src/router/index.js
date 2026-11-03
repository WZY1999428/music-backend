
export default {
    action: '首页',
    logType: 'INDEX',
    /** @type {Controller} */
    handler: async (ctx) => {
        ctx.body = `<h1>111</h1>`;
    },
}