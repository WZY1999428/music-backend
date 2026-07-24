import generateToken from "utils/token.js";

export default async (ctx) => {
    const token = await generateToken({ name: "test", userId: 123 });
    const { user } = ctx.request.query
    $validate(user, "用户不能为空")
    ctx.body = `
        <h1>hello world</h1> ${token}
    `;
}
