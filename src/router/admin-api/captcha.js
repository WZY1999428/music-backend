export default {
    action: '获取验证码',
    logType: 'GET_CAPTCHA',
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        const captcha = await import('svg-captcha');
        const cap = captcha.create({ size: 4, ignoreChars: '0o1i', noise: 2, color: true, background: '#fff' });
        const randomId = Math.random().toString(36).substring(2, 30);
        const existingId = ctx.cookies.get("captcha_id");
        if (existingId) await valkey.delCaptcha(existingId);
        await valkey.setCaptcha(randomId, cap.text);

        ctx.cookies.set("captcha_id", randomId, {
            httpOnly: true,
            maxAge: 5 * 60 * 1000,
            sameSite: "lax",
            // secure: process.env.NODE_ENV === "production"
        });

        ctx.type = 'image/svg+xml';
        ctx.body = cap.data;
    },
}