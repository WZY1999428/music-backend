import * as swc from "@swc/core";
import fs from "fs";
import path from "path";

const js_path = [];
const root_path = path.resolve(process.cwd(), "./src");
loadJs();
function loadJs() {
    const dirs = [root_path];
    while (dirs.length) {
        const dir = dirs.shift();
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
            const new_file = path.resolve(dir, file.name);
            if (file.isDirectory()) {
                dirs.push(new_file);
            } else if (file.isFile() && file.name.endsWith('.js')) {
                js_path.push(new_file);
            }
        }
    }
}

console.log(js_path);
