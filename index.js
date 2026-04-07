const registerTomlEnv = require("./src/utils/registerTomlEnv");
registerTomlEnv()
const app = require("./src/app")
app.listen(process.env.SERVER_PORT, () => {
    console.log(`Server is running on port http://localhost:${process.env.SERVER_PORT}`);
});