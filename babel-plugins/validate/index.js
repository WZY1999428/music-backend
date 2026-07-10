import * as t from "@babel/types";
import template from "@babel/template";
import fs from "fs";
import path from "path";

let isFileGenerated = false;

export default async function (api) {
  api.assertVersion(8);
  const validators = await import("./generated-validators.cjs")
  const funcs = Object.keys(validators.default).map(f => `\$${f}`)
  return {
    visitor: {
      // 2. 扫描到每一个文件的根节点（Program）时
      Program: {
        enter(_, state) {
          if (!isFileGenerated) {
            // 导入移动校验js模块
            const isDev = process.env.NODE_ENV === "development";
            // 拿到编译输出的目标目录（比如 dist）
            const outDir = state.opts.outDir || path.resolve(process.cwd(), isDev ? 'src' : ".output");
            if (!fs.existsSync(outDir)) {
              fs.mkdirSync(outDir, { recursive: true });
            }
            // 强行在 模板 目录下写入一个纯净的全局校验文件
            const targetPath = path.join(outDir, "generated-validators.js");
            fs.copyFileSync(path.resolve("babel-plugins", "validate", "generated-validators.cjs"), targetPath);
            isFileGenerated = true;
          }
        },
        exit(programPath, state) {
          let needImport = false;
          const usedMethods = new Set();
          // 遍历当前文件，看看有没有用过我们的魔法函数
          programPath.traverse({
            CallExpression(callPath) {
              let funcName = callPath.node.callee.name;
              if (funcs.includes(funcName)) {
                needImport = true;
                funcName = funcName.replace("$", "");
                usedMethods.add(funcName);
                // 核心改写：把原本的 validateEmail(email, "错误")
                // 改写为标准的普通的函数调用，同时配合抛出错误（结合我们上一步说的全局拦截）
                const valueNode = callPath.node.arguments[0];
                const messageNode = callPath.node.arguments[1] || t.stringLiteral("格式不正确");
                // 生成转换后的原生 if 判断代码，此时调用的是我们即将导入的方法
                const buildIf = template.statement(`
                  if (!%%funcName%%(%%value%%)) {
                    return ctx.fail(%%message%%);
                  }
                `);

                const newNode = buildIf({
                  funcName: t.identifier(funcName),
                  value: valueNode,
                  message: messageNode
                });

                // 替换整行
                if (callPath.parentPath.isExpressionStatement()) {
                  callPath.parentPath.replaceWith(newNode);
                }
              }
            }
          });

          // 3. 如果当前文件确实用了这些方法，我们在文件顶部插入 require 语句
          if (needImport) {
            // 计算当前处理的文件和我们生成的工具文件之间的“相对路径”
            // 比如你在 dist/routes/user.js，工具在 dist/generated-validators.js
            // 那就需要计算出 '../generated-validators.js'
            const currentFileDest = state.file.opts.filename.replace("src", "dist"); // 估算输出路径
            const currentDir = path.dirname(currentFileDest);
            const outDir = state.opts.outDir || path.resolve(process.cwd(), "dist");
            const targetPath = path.join(outDir, "generated-validators.js");

            let relativePath = path.relative(currentDir, targetPath).replace(/\\/g, "/");
            if (!relativePath.startsWith(".")) relativePath = "./" + relativePath;
            // 用 template 优雅地在顶部生成：const { validateEmail, ... } = require('...');
            const methodsStr = Array.from(usedMethods).join(", ");
            const importRequire = template.statement(`
              const { ${methodsStr} } = require('${relativePath}');
            `)();

            // 塞到文件最顶部
            programPath.unshiftContainer("body", importRequire);
          }
        }
      }
    }
  };
}