
import { build, plugin } from "./compiler.mjs";
import scanAutoImportPath from "../swc-plugins/swc-plugin-auto-import/scanning.mjs"
await build({
    root: "./src",
    output: "./.output",
    plugins: [
        plugin({
            name: "swc-plugin-auto-import",
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