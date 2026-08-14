
import { devRun } from "./compiler.mjs";
import path from "path";

const swcPluginsPath = path.resolve(
    process.cwd(),
    "./swc-plugins"
);

function plugin(name, options = {}) {
    const pluginName = name.replaceAll("-", "_");
    return {
        path: path.join(
            swcPluginsPath,
            name,
            `${pluginName}.wasm`
        ),
        options,
    };
}



const jsMap = await devRun({
    root: "./src",
    output: "src",
    mode: "development",
    plugins: [
        plugin("swc-plugin-validate"),
        plugin("swc-plugin-path-resolver", {
            alias: {
                "@/": "./src/",
            },
        }),
    ],
});

console.log(jsMap);



