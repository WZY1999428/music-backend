
import { devRun, plugin } from "./compiler.mjs";
import VmRuntime from "./vmruntime/index.js";
import scanAutoImportPath from "../swc-plugins/swc-plugin-auto-import/scanning.mjs"
import path from "path";
const jsMap = await devRun({
    root: path.resolve("src"),
    output: "src",
    mode: "development",
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

const rt = await VmRuntime.init({
    codeMap: jsMap,
    rootPath: path.resolve("src/index.js"),
})

await rt.evaluate();