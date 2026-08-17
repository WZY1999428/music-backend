import vm from "node:vm";
import fs from "node:fs/promises";
import path from "node:path";
import { isBuiltin } from "node:module";

const npmPackage = JSON.parse(
    await fs.readFile(path.resolve("package.json"), "utf8")
);

const dependencies = new Set(Object.keys(npmPackage.dependencies ?? {}));

const devDependencies = new Set(Object.keys(npmPackage.devDependencies ?? {}));

const contextifiedObject = vm.createContext(globalThis);

const rootPath = path.resolve("./.output/index.js");

/**
 * 模块缓存
 *
 * key:
 *   规范化后的绝对路径
 *
 * value:
 *   SourceTextModule
 */
const moduleCache = new Map();

/**
 * npm / builtin 模块缓存
 *
 * key:
 *   package specifier
 *
 * value:
 *   SyntheticModule
 */
const packageCache = new Map();


/**
 * 规范化模块路径
 */
function normalizePath(filePath) {
    return path.normalize(
        path.resolve(filePath)
    );
}


/**
 * 加载 npm / Node builtin 模块
 */
async function loadPackage(specifier, context) {

    // 已经加载过
    if (packageCache.has(specifier)) {
        return packageCache.get(specifier);
    }

    const ns = await import(specifier);

    const module = new vm.SyntheticModule(
        Object.keys(ns),

        function () {
            for (const key of Object.keys(ns)) {
                this.setExport(key, ns[key]);
            }
        },

        {
            context,
            identifier: specifier
        }
    );

    // ⭐ 创建后立即缓存
    packageCache.set(specifier, module);

    return module;
}



function getPackageName(specifier) {
    if (specifier.startsWith("@")) {
        const parts = specifier.split("/");

        return parts.length >= 2
            ? `${parts[0]}/${parts[1]}`
            : specifier;
    }

    return specifier.split("/")[0];
}


function isPackageSpecifier(specifier) {
    // 相对路径
    if (
        specifier.startsWith("./") ||
        specifier.startsWith("../") ||
        specifier.startsWith("/")
    ) {
        return false;
    }

    // Windows 绝对路径
    if (
        /^[a-zA-Z]:[\\/]/.test(specifier)
    ) {
        return false;
    }

    // file://
    if (
        specifier.startsWith("file://")
    ) {
        return false;
    }

    return true;
}


/**
 * 加载普通 JS 模块
 */
async function loadModule(specifier, referencingModule) {

    /**
     * npm / builtin
     */
    if (isPackageSpecifier(specifier)) {
        const packageName = getPackageName(specifier);
        if (isBuiltin(packageName) || dependencies.has(packageName) || devDependencies.has(packageName)) {
            return loadPackage(
                specifier,
                referencingModule.context
            );
        }
    }

    /**
     * 处理 file://
     */
    let absolutePath = specifier;

    const split = specifier.split("file:///")[1];

    if (split) {
        absolutePath = decodeURIComponent(split);
    }


    /**
     * 相对路径
     */
    if (!path.isAbsolute(absolutePath)) {
        absolutePath = path.resolve(
            path.dirname(referencingModule.identifier),
            absolutePath
        );
    }


    /**
     * 自动补 .js
     */
    const parsed = path.parse(absolutePath);

    if (!parsed.ext) {
        absolutePath += ".js";
    }


    /**
     * ⭐ 最终统一成绝对规范路径
     */
    absolutePath = normalizePath(absolutePath);


    /**
     * ⭐⭐⭐ 核心：模块缓存
     */
    if (moduleCache.has(absolutePath)) {
        console.log(
            "[CACHE]",
            absolutePath
        );

        return moduleCache.get(absolutePath);
    }


    console.log(
        "[LOAD]",
        absolutePath
    );


    const code = await fs.readFile(
        absolutePath,
        "utf8"
    );


    /**
     * 创建 SourceTextModule
     */
    const module = new vm.SourceTextModule(
        code,
        {
            context: referencingModule.context,

            identifier: absolutePath,

            importModuleDynamically
        }
    );


    /**
     * ⭐⭐⭐ 非常重要
     *
     * 创建出来以后马上缓存
     *
     * 不要等 evaluate()
     */
    moduleCache.set(
        absolutePath,
        module
    );


    return module;
}


/**
 * dynamic import()
 */
async function importModuleDynamically(
    specifier,
    referencingModule
) {

    const module = await loadModule(
        specifier,
        referencingModule
    );


    /**
     * 还没有 link
     */
    if (module.status === "unlinked") {
        await module.link(loadModule);
    }


    /**
     * 还没有 evaluate
     */
    if (
        module.status !== "evaluated" &&
        module.status !== "evaluating"
    ) {
        await module.evaluate();
    }


    return module;
}


/**
 * 创建 root module
 */
const rootModule = new vm.SourceTextModule(
    await fs.readFile(
        rootPath,
        "utf8"
    ),
    {
        context: contextifiedObject,

        identifier: normalizePath(rootPath),

        importModuleDynamically
    }
);


/**
 * root 也放进缓存
 */
moduleCache.set(
    normalizePath(rootPath),
    rootModule
);


/**
 * link
 */
await rootModule.link(
    loadModule
);


/**
 * evaluate
 */
await rootModule.evaluate();