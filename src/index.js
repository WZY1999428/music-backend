

require('module-alias/register');
const registerTomlEnv = require("@/bootstrap/registerTomlEnv");
registerTomlEnv()
const app = require("./app")
app.listen(process.env.SERVER_PORT, () => {
    console.log(`Server is running on port http://localhost:${process.env.SERVER_PORT}`);
});