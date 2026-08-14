import vm from 'node:vm';
import fs from 'node:fs/promises';
import path from "path";
import { isBuiltin } from "node:module";
const npmPackage = JSON.parse(await fs.readFile("./package.json"));
const dependencies = new Set(Object.keys(npmPackage.dependencies))
const devDependencies = new Set(Object.keys(npmPackage.devDependencies))
const contextifiedObject = vm.createContext(globalThis);

// 步骤 1
//
// 通过构造一个新的 `vm.SourceTextModule` 对象来创建模块。这会解析提供的源代码文本，
// 如果出现任何问题会抛出 `SyntaxError`。默认情况下，模块是在顶层上下文中创建的。
// 但在这里，我们指定 `contextifiedObject` 作为该模块所属的上下文。
//
// 在这里，我们尝试从模块 "foo" 获取默认导出，并将其放入本地绑定 "secret" 中。
const rootPath = path.resolve("./.output/index.js");
const rootModule = new vm.SourceTextModule(await fs.readFile(rootPath, "utf-8"), {
    context: contextifiedObject, identifier: "D:/project/template/.output/index.js",
    importModuleDynamically
});

// 步骤 2
//
// 将此模块的导入依赖"链接"到它。
//
// 提供的链接回调（即"linker"）接受两个参数：父模块（在此例中为 `bar`）和
// 作为导入模块说明符的字符串。该回调预期返回一个与提供的说明符对应的模块，
// 并满足 `module.link()` 中记录的特定要求。
//
// 如果返回的模块尚未开始链接，则会在返回的模块上调用相同的链接器回调。
//
// 即使是没有依赖项的顶层模块也必须显式链接。然而，提供的回调永远不会被调用。
//
// link() 方法返回一个 Promise，当链接器返回的所有 Promise 都解析时，
// 该 Promise 将被解析。
//
// 注意：这是一个人为设计的示例，链接器函数每次被调用时都会创建一个新的
// "foo" 模块。在完整的模块系统中，可能会使用缓存来避免重复的模块。



async function loadModule(specifier, referencingModule) {
    const packageName = specifier.split("/")[0];
    if (isBuiltin(packageName) || dependencies.has(packageName) || devDependencies.has(packageName) || dependencies.has(specifier) || dependencies.has(specifier)) {
        const ns = await import(specifier);

        return new vm.SyntheticModule(
            Object.keys(ns),
            function () { for (const key of Object.keys(ns)) this.setExport(key, ns[key]); },
            { context: referencingModule.context, identifier: specifier }
        );
    }

    const absolutePath = path.resolve(
        path.dirname(referencingModule.identifier),
        specifier
    );

    const code = await fs.readFile(absolutePath, "utf8");

    return new vm.SourceTextModule(code, {
        context: referencingModule.context,
        identifier: absolutePath,
        importModuleDynamically
    });
}


async function importModuleDynamically(
    specifier,
    referencingModule
) {
    const module = await loadModule(
        specifier,
        referencingModule
    );

    if (module.status === "unlinked") {
        await module.link(loadModule);
    }

    await module.evaluate();

    return module;
}


await rootModule.link(loadModule);

// 步骤 3
//
// 评估模块。evaluate() 方法返回一个 promise，该 promise 将在
// 模块完成评估后解析。

// 打印 42。
await rootModule.evaluate();