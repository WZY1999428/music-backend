import * as swc from "@swc/core";
import fs from "fs/promises";
import path from "path";

const BATCH_COUNT = 10;
const jsMap = new Map();



export async function plugin({
    name,
    swcPluginsPath = path.resolve("swc-plugins"),
    options = {}
}) {
    let wasm_path = name;
    if (!path.isAbsolute(name)) {
        const pluginName = name.replaceAll("-", "_");
        wasm_path = path.join(
            swcPluginsPath,
            name,
            `${pluginName}.wasm`
        );
    }

    options = await options;

    return {
        path: wasm_path,
        options
    };
}


export async function build({
    root = "./src",
    output = "./.output",
    mode = "production",
    plugins = [],
    batchCount = BATCH_COUNT,
} = {}) {
    const rootPath = path.resolve(process.cwd(), root);
    const outputPath = path.resolve(process.cwd(), output);
    const files = await collectFiles(rootPath, outputPath);
    await prepareOutput(files, outputPath);
    await transformJsFiles(
        files.js,
        plugins,
        batchCount,
        false
    );
    if (mode == "development") return jsMap;
}

export async function devRun({
    root = "./src",
    output = "./.output",
    plugins = [],
    batchCount = BATCH_COUNT,
} = {}) {
    const rootPath = path.resolve(process.cwd(), root);
    const outputPath = path.resolve(process.cwd(), output);
    const files = await collectFiles(rootPath, outputPath);
    await transformJsFiles(
        files.js,
        plugins,
        batchCount,
        true
    );
    return jsMap;
}




async function collectFiles(rootPath, outputPath) {
    const jsFiles = [];
    const otherFiles = [];
    const dirs = new Set();

    const queue = [rootPath];

    while (queue.length) {
        const dir = queue.shift();

        const files = await fs.readdir(dir, { withFileTypes: true });

        for (const file of files) {
            const input = path.join(dir, file.name);

            const relative = path.relative(rootPath, input);

            const output = path.join(outputPath, relative);

            if (file.isDirectory()) {
                dirs.add(output);
                queue.push(input);
                continue;
            }

            if (!file.isFile()) continue;

            if (file.name.endsWith(".js")) {
                jsFiles.push({ input, output });
            } else {
                otherFiles.push({ input, output });
            }
        }
    }

    return {
        js: jsFiles,
        other: otherFiles,
        dirs,
    };
}

async function prepareOutput(files, outputPath) {
    await fs.mkdir(outputPath, {
        recursive: true,
    });

    await Promise.all(
        [...files.dirs].map(dir =>
            fs.mkdir(dir, {
                recursive: true,
            })
        )
    );

    await Promise.all(
        files.other.map(async file => {
            await fs.mkdir(
                path.dirname(file.output),
                { recursive: true }
            );

            await fs.copyFile(
                file.input,
                file.output
            );
        })
    );
}

async function transformJsFiles(
    files,
    plugins,
    batchCount,
    devRun = false
) {
    const swcPlugins = await Promise.all(
        plugins.map(async p => {
            const { path, options = {} } = await p;
            return [path, options];
        })
    );


    for (let i = 0; i < files.length; i += batchCount) {
        const batch = files.slice(i, i + batchCount);
        await Promise.all(
            batch.map(file => transform(file, swcPlugins, devRun))
        );
    }
}

async function transform(file, plugins, devRun) {
    const code = await fs.readFile(
        file.input,
        "utf8"
    );

    const result = await swc.transform(code, {
        filename: file.input,

        jsc: {
            target: "es2022",

            parser: {
                syntax: "ecmascript",
            },

            experimental: {
                plugins,
            },
        },
    });

    if (devRun) jsMap.set(file.output, result.code);
    else {
        await fs.mkdir(path.dirname(file.output), { recursive: true });
        await fs.writeFile(file.output, result.code)
    };
}