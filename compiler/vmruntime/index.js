import vm from "node:vm";
import fs from "node:fs/promises";
import path from "node:path";
import { isBuiltin } from "node:module";
/**
   * 规范化模块路径
   */
const normalizePath = (filePath) => path.normalize(path.resolve(filePath));

class VmRuntime {
    constructor(options) {
        const { npmPackage, rootPath, codeMap } = options;
        this.dependencies = new Set(Object.keys(npmPackage.dependencies ?? {}));
        this.devDependencies = new Set(Object.keys(npmPackage.devDependencies ?? {}));
        this.codeMap = codeMap,
            this.rootPath = rootPath;
        this.moduleCache = new Map();
        this.packageCache = new Map();
    }

    static async init(options) {
        let { npmPackagePath = path.resolve("package.json"), rootPath = path.resolve("./.output/index.js"), codeMap = new Map() } = options;
        const npmPackage = JSON.parse(await fs.readFile(npmPackagePath, "utf8"));
        rootPath = normalizePath(rootPath);
        if (!codeMap.has(rootPath)) throw new Error("代码中不存在该路径")
        /**
         * 创建 root module
         */

        const rt = new VmRuntime({ rootPath, codeMap, npmPackage });

        const rootModule = new vm.SourceTextModule(codeMap.get(rootPath),
            {
                context: vm.createContext(globalThis),
                identifier: normalizePath(rootPath),
                importModuleDynamically: (specifier, referencingModule) => rt.importModuleDynamically(specifier, referencingModule)
            }
        );
        /**
         * link
         */

        rt.rootModule = rootModule;
        /**
         * root 也放进缓存
         */
        rt.moduleCache.set(normalizePath(rootPath), rootModule);

        await rootModule.link((specifier, referencingModule) => {
            return rt.loadModule(specifier, referencingModule);
        });
        return rt
    }



    /**
     * 加载 npm / Node builtin 模块
     */
    async loadPackage(specifier, context) {

        // 已经加载过
        if (this.packageCache.has(specifier)) {
            return this.packageCache.get(specifier);
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
        this.packageCache.set(specifier, module);

        return module;
    }



    getPackageName(specifier) {
        if (specifier.startsWith("@")) {
            const parts = specifier.split("/");
            return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
        }

        return specifier.split("/")[0];
    }


    isPackageSpecifier(specifier) {
        // 相对路径
        if (specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith("/")) {
            return false;
        }

        // Windows 绝对路径
        if (/^[a-zA-Z]:[\\/]/.test(specifier)) {
            return false;
        }

        // file://
        if (specifier.startsWith("file://")) {
            return false;
        }
        return true;
    }



    /**
     * 加载普通 JS 模块
     */
    async loadModule(specifier, referencingModule) {

        /**
         * npm / builtin
         */
        if (this.isPackageSpecifier(specifier)) {
            const packageName = this.getPackageName(specifier);
            if (isBuiltin(packageName) || this.dependencies.has(packageName) || this.devDependencies.has(packageName)) {
                return this.loadPackage(specifier, referencingModule.context);
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
            absolutePath = path.resolve(path.dirname(referencingModule.identifier), absolutePath);
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
        if (this.moduleCache.has(absolutePath)) {
            console.log("[CACHE]", absolutePath);
            return this.moduleCache.get(absolutePath);
        }

        console.log("[LOAD]", absolutePath);

        let code = this.codeMap.get(absolutePath); 
        if (!code) code = await fs.readFile(absolutePath, "utf-8")
        /**
         * 创建 SourceTextModule
         */
        const module = new vm.SourceTextModule(
            code,
            {
                context: referencingModule.context,
                identifier: absolutePath,
                importModuleDynamically: (specifier, referencingModule) => this.importModuleDynamically(specifier, referencingModule)
            }
        );


        /**
         * ⭐⭐⭐ 非常重要
         *
         * 创建出来以后马上缓存
         *
         * 不要等 evaluate()
         */
        this.moduleCache.set(absolutePath, module);


        return module;
    }


    /**
     * dynamic import()
     */
    async importModuleDynamically(
        specifier,
        referencingModule
    ) {

        const module = await this.loadModule(
            specifier,
            referencingModule
        );


        /**
         * 还没有 link
         */
        if (module.status === "unlinked") {
            await module.link((specifier, referencingModule) => this.loadModule(specifier, referencingModule));
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


    async evaluate() {
        await this.rootModule.evaluate();
    }
}




export default VmRuntime;