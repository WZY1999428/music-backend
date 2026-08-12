import * as swc from "@swc/core";
import fs from "fs/promises";
import path from "path";
const js_batch = [];
const other_files = [];
const BATCH_COUNT = 10;
const root_path = path.resolve(process.cwd(), "./src");
const output_path = path.resolve(process.cwd(), "./out");
await loadJs();
async function loadJs() {
    const dirs = [root_path];
    const arr = [];
    while (dirs.length) {
        const dir = dirs.shift();
        const files = await fs.readdir(dir, { withFileTypes: true });
        for (const file of files) {
            const new_file = path.resolve(dir, file.name);
            const output = new_file.replace(root_path, output_path);
            if (file.isDirectory()) {
                dirs.push(new_file);
            } else if (file.isFile() && file.name.endsWith('.js')) {
                arr.push({
                    input: new_file,
                    output: output
                });
                if (arr.length >= BATCH_COUNT) {
                    js_batch.push(new Array(...arr));
                    arr.length = 0;
                }
            } else {
                const exists = await fs.access(output).then(() => true).catch(() => false);
                if (!exists) other_files.push(new_file)
            }
        }
    }
    if (arr.length > 0) {
        js_batch.push(new Array(...arr));
    }
}

for (const batch of js_batch) {
    const batchPromise = batch.map(item => transform(item.input, item.output))
    const outputs = await Promise.all(batchPromise);
    for (const output of outputs) {
        console.log(output.code)
        // output.map;
    }
}


async function transform(input, ouput) {
    return swc.transform(await fs.readFile(input, "utf-8"), {
        filename: input,
        jsc: {
            target: "es2022",
            parser: {
                syntax: "ecmascript",
            },
            transform: {},
        },
    })
}

