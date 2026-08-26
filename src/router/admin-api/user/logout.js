/** @type {Controller} */
export default async (ctx) => {
    const token = ctx.headers["authorization"];
    await valkey.delToken(token);
    ctx.success(null, "退出成功")
}