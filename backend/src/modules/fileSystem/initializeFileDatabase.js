const { FileTable } = require("@/modules/sqlite/model");
const fs = require("fs-extra");
const fileDir = process.env.PUBLIC_FILE_PATCH;
const { queueScanning } = require("./utils");
const readline = require("readline");

function askQuestion(q) {
    const dbRootPaths = [...new Set(allFiles.map(f => f.rootPath || ""))].filter(p => p);
    console.log(`
          ⚠ 检测到文件数据库中没有与当前配置 rootPath 匹配的记录。 \n
          数据库中存在的 rootPath:", ${dbRootPaths.length ? dbRootPaths.join(", ") : "(无)"} \n
          "当前配置 rootPath:", fileDir \n
          请选择处理方式： \n
          1. 清空数据库并重新同步 \n
          2. 直接同步（不清空数据库，可能出现重复记录） \n
          3. 退出 \n
         `);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve =>
        rl.question(q, ans => {
            rl.close();
            resolve(ans.trim());
        })
    );
}

async function initFileDB() { 
    try {
        const filePaths = [ 
            {
                rootPath: fileDir,
                path: "",
                id: 0,
            }
        ] 
        await fs.ensureDir(fileDir);
        await FileTable.ready;
        const allFiles = await FileTable.find([]);
        if (allFiles.length === 0) {
            console.log("初始化文件数据库...");
            await queueScanning(filePaths);
            console.log("文件数据库初始化完成");
            return true;
        } 

        // 检查是否有与当前 fileDir 匹配的记录
        const matching = allFiles.filter(f => f.rootPath === fileDir);
        if (matching.length === 0) {
            const ans = await askQuestion("\n输入选项（1/2/3）：");
            if (ans === "1") {
                console.log("清空数据库...");
                await FileTable.deleteMany([{ field: "rootPath", value: "", op: "!=" }]);
                console.log("重新扫描目录...");
                await queueScanning(filePaths);
                console.log("完成：数据库已重建并同步。");
                return true;
            }
            if (ans === "2") {
                console.log("直接同步，不清空数据库...");
                await queueScanning(filePaths);
                console.log("同步完成");
                return true;
            }
            console.log("已退出，不进行同步。");
            return false;
        }
        // 情况 C：存在匹配的 rootPath -> 正常通过
        return true;
    } catch (err) {
        console.error("初始化文件数据库失败:", err);
        return false;
    }
};


module.exports = initFileDB 