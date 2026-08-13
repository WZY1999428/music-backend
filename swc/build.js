
import { build } from "./compiler.mjs";
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



await build({
    root: "./src",
    output: "./.output",
    plugins: [
        plugin("swc-plugin-validate"),
        plugin("swc-plugin-path-resolver", {
            alias: {
                "@/": "./src/",
            },
        }),
    ],
});