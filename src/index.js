

require('module-alias/register');
const registerTomlEnv = require("@/bootstrap/registerTomlEnv");
registerTomlEnv()
const { initDb } = require("@/schema/init");
initDb().then(res => {
    const app = require("./app")
    app.listen(process.env.SERVER_PORT, () => {
        console.log(`Server is running on port http://localhost:${process.env.SERVER_PORT}`);
    });
}).catch(err => {
    console.log("数据库初始化失败", err)
    process.exit(1)
})

