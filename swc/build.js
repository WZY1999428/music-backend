
import { build, plugin } from "./compiler.mjs";
import path from "path";
const swcPluginsPath = path.resolve(
    process.cwd(),
    "./swc-plugins"
);


await build({
    root: "./src",
    output: "./.output",
    plugins: [
        plugin("swc-plugin-validate", swcPluginsPath),
        plugin("D:/project/swc-plugins/target/wasm32-wasip1/release/swc_plugin_path_resolver.wasm", swcPluginsPath, {
            alias: {
                "@/": "./src/",
                "@swc-plugins/": "./swc-plugins/",
            },
        }),
    ],
});