
import { build, plugin } from "./compiler.mjs";
import scanAutoImportPath from "../swc-plugins/swc-plugin-auto-import/scanning.mjs"
await build({
    root: "./test",
    output: "./.output",
    plugins: [
        plugin({
            name: "D:/project/swc-plugins/target/wasm32-wasip1/release/swc_plugin_auto_import.wasm",
            options: scanAutoImportPath(["./src/utils"])
        })
        ,
        plugin({
            name: "swc-plugin-validate"
        }),
        plugin({
            name: "swc-plugin-path-resolver",
            options: {
                alias: {
                    "@/": "./src/",
                    "@swc-plugins/": "./swc-plugins/",
                },
            }
        }),
    ],
});