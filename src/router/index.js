const generateToken = require("#/model/token");

module.exports = async (ctx) => {
    const token = await generateToken({ name: "test", userId: 123 });
    console.log(token);

    ctx.body = `
        <h1>hello world</h1>
    `;
}