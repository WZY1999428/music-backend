import fs from "fs";
import path from "path";
import { parse } from "@swc/core"


const exportTypes = new Set([
    "ExportDefaultExpression",
    "ExportDeclaration",
    "ExportDefaultDeclaration",
    "ExportNamedDeclaration"
]);
const funcDecl = ["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"];

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
                const filename = file.name.split(".")[0];
                if (ast.type == "Module") {
                    const exports = [];
                    for (const node of ast.body) {
                        if (!exportTypes.has(node.type)) {
                            continue;
                        }
                        const info = getExportInfo(node, ast);
                        if (info) {
                            if (Array.isArray(info)) exports.push(...(info.map(f => ({ ...f, filename }))));
                            else exports.push({ ...info, filename })
                        }
                    }
                    exports.sort((a, b) => {
                        const priority = { ExportDefaultDeclaration: 0, ExportDeclaration: 1, ExportNamedDeclaration: 1 };
                        return (priority[a.exportType] ?? 2) - (priority[b.exportType] ?? 2);
                    });
                    jsFiles.push({ input: path.normalize(input), exports });
                }
            }
        }
    }

    return jsFiles
}


function findBinding(ast, name) {
    for (const item of ast.body) {
        if (
            item.type === "FunctionDeclaration" &&
            item.identifier?.value === name
        ) {
            return item;
        }


        if (
            item.type === "ClassDeclaration" &&
            item.identifier?.value === name
        ) {
            return item;
        }


        // const cccc = ...
        if (item.type === "VariableDeclaration") {
            for (const decl of item.declarations) {
                if (decl.id?.type === "Identifier" &&
                    decl.id.value === name) {
                    return decl.init;
                }
            }
        }
    }


    return null;
}

function getExportInfo(node, ast) {
    const isFuncDecl = (type) => funcDecl.includes(type);
    const getArgsLen = (decl) => {
        return isFuncDecl(decl?.type)
            ? decl.params?.length ?? 0
            : 0;
    };
    switch (node.type) {
        case "ExportDeclaration": {
            const declaration = node.declaration;
            if (["const", "let", "var"].includes(declaration.kind)) {
                return declaration.declarations.map((decl) => ({
                    exportName: decl.id?.value,
                    argsLen: getArgsLen(decl.init),
                    exportType: node.type,
                    declType: decl.init?.type,
                }));
            }

            return {
                exportName: declaration.identifier?.value ?? "default",
                argsLen: getArgsLen(declaration),
                exportType: node.type,
                declType: declaration.type,
            };
        }

        case "ExportDefaultDeclaration": {
            const decl = node.decl;
            return {
                exportName: decl?.identifier?.value ?? "default",
                argsLen: getArgsLen(decl),
                exportType: node.type,
                declType: decl?.type,
            };
        }

        case "ExportDefaultExpression": {
            const expression = node.expression;
            let name = expression.value ?? "default";
            let declType = expression?.type;
            if (expression.type == "Identifier") {
                const data = findBinding(ast, name);
                if (data) declType = data.type;
            }
            return {
                exportName: expression.value ?? "default",
                argsLen: getArgsLen(expression),
                exportType: node.type,
                declType: declType
            };
        }

        case "ExportNamedDeclaration": {
            return node.specifiers.map((decl) => {
                if (decl.name) {
                    return {
                        exportName: decl.name.value,
                        argsLen: getArgsLen(decl.name),
                        exportType: node.type,
                        declType: "ObjectExpression"
                    }
                }

                let exportName = decl.orig?.value;
                if (decl.exported) {
                    exportName = decl.exported.value;
                }
                const info = {
                    exportName: exportName,
                    argsLen: getArgsLen(decl.orig),
                    exportType: node.type,
                    declType: decl.orig?.type
                }
                if (decl.orig?.type == "Identifier") {
                    const data = findBinding(ast, decl.orig?.value);
                    if (data) info.declType = data.type;
                }
                return info

            });
        }

        default:
            return null;
    }
}

export default async (autoImportPaths = []) => {
    const results = await Promise.all(
        autoImportPaths.map(p =>
            collectFiles(path.resolve(p))
        )
    );
    return results.flat().filter(item => item.exports.length > 0);
};