
export default {
    action: '首页',
    logType: 'INDEX',
    /** @type {Controller} */
    handler: async (ctx) => {
        const token = await generateToken({ name: "test", userId: 123 });
        ctx.body = `
        <h1>hello world</h1> ${token}
    `;
    },
}