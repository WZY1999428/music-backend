
import { devRun, plugin } from "./compiler.mjs";
import VmRuntime from "./vmruntime/index.js";
import path from "path";

const swcPluginsPath = path.resolve(
    process.cwd(),
    "./swc-plugins"
);

const jsMap = await devRun({
    root: "./src",
    output: "src",
    mode: "development",
    plugins: [
        plugin("swc-plugin-validate", swcPluginsPath),
        plugin("swc-plugin-path-resolver", swcPluginsPath, {
            alias: {
                "@/": "./src/",
                "@swc-plugins/": "./swc-plugins/",
            },
        }),
    ],
});


const rt = await VmRuntime.init({
    codeMap: jsMap,
    rootPath: path.resolve("src/index.js"),
})

await rt.evaluate();