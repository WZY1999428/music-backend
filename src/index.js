import registerTomlEnv from "bootstrap/registerTomlEnv.js";
registerTomlEnv()
const { initDb } = await import("./database/index.js");
await initDb()
import("./app.js").then(({ default: app }) => {
    app.listen(process.env.SERVER_PORT, () => {
        console.log("server started");
    });
});