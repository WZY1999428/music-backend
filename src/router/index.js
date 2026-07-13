const generateToken = require("@/utils/token");

module.exports = async (ctx) => {
    const token = await generateToken({ name: "test", userId: 123 });
    const { user } = ctx.request.query
    $validate(user, "用户不能为空")
    console.log(token);
    ctx.body = `
        <h1>hello world</h1> ${token}
    `;
}
