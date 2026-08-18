import fs from "fs";
import path from "path";
import { parse } from "@swc/core"


const exportTypes = new Set([
    "ExportDefaultExpression",
    "ExportDeclaration",
    "ExportDefaultDeclaration",
]);


async function collectFiles(rootPath) {
    const jsFiles = [];
    const queue = [rootPath];
    while (queue.length) {
        const dir = queue.shift();
        const files = fs.readdirSync(dir, { withFileTypes: true });
        for (const file of files) {
            const input = path.join(dir, file.name);
            if (file.isDirectory()) {
                queue.push(input);
                continue;
            }
            if (file.name.endsWith(".js")) {
                const ast = await parse(fs.readFileSync(input, 'utf-8'), { syntax: "ecmascript", })
                if (ast.type == "Module") {
                    const exports = [];
                    for (const node of ast.body) {
                        if (!exportTypes.has(node.type)) {
                            continue;
                        }
                        const info = getExportInfo(node);
                        if (info) {
                            exports.push(info);
                        }
                    }
                    jsFiles.push({ input: path.normalize(input), exports });
                }
            }
        }
    }

    return jsFiles
}

function getExportInfo(node) {
    let target;
    let exportName = "default";

    switch (node.type) {
        case "ExportDeclaration":
            target = node.declaration;
            exportName = target?.identifier?.value ?? "";
            break;

        case "ExportDefaultDeclaration":
            target = node.decl;
            exportName = target?.identifier?.value ?? "default";
            break;

        case "ExportDefaultExpression":
            target = node.expression;
            break;
    }

    if (!target) {
        return null;
    }

    const declType = target.type;

    const argsLen =
        declType === "FunctionDeclaration" ||
            declType === "FunctionExpression" ||
            declType === "ArrowFunctionExpression"
            ? target.params.length
            : 0;

    return {
        exportName,
        argsLen,
        exportType: node.type,
        declType,
    };
}
export default async (autoImportPaths = []) => {
    const results = await Promise.all(
        autoImportPaths.map(p =>
            collectFiles(path.resolve(p))
        )
    );
    return results.flat();
};