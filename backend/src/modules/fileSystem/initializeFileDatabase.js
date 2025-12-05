const { FileTable } = require("../sqlite/model");
// const watchFiles = require("./watchFiles");
const fileDir = process.env.PUBLIC_FILE_PATCH;
const { scanDir } = require("./utils");
const readline = require("readline");

function askQuestion(q) {
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

module.exports = async function initFileDB() {
    try {
        // watchFiles();

        // 先一次性读出所有记录（你说得对，要提前）
        const allFiles = await FileTable.find([]);

        // 情况 A：数据库完全空 -> 全量初始化
        if (allFiles.length === 0) {
            console.log("初始化文件数据库...");
            await scanDir(fileDir, 0, 0);
            console.log("文件数据库初始化完成");
            return true;
        }

        // 检查是否有与当前 fileDir 匹配的记录
        const matching = allFiles.filter(f => f.rootPath === fileDir);

        // 情况 B：数据库有数据，但没有匹配当前 rootPath -> 提示用户处理
        if (matching.length === 0) {
            const dbRootPaths = [...new Set(allFiles.map(f => f.rootPath || ""))].filter(p => p);
            console.log("\n⚠ 检测到文件数据库中没有与当前配置 rootPath 匹配的记录。");
            console.log("数据库中存在的 rootPath:", dbRootPaths.length ? dbRootPaths.join(", ") : "(无)");
            console.log("当前配置 rootPath:", fileDir);
            console.log("\n请选择处理方式：");
            console.log("1. 清空数据库并重新同步");
            console.log("2. 直接同步（不清空数据库，可能出现重复记录）");
            console.log("3. 退出");

            const ans = await askQuestion("\n输入选项（1/2/3）：");

            if (ans === "1") {
                console.log("清空数据库...");
                await FileTable.deleteMany({
                    rootPath: {
                        $not: "",
                    },
                });
                console.log("重新扫描目录...");
                await scanDir(fileDir, 0, 0);
                console.log("完成：数据库已重建并同步。");
                return true;
            }

            if (ans === "2") {
                console.log("直接同步，不清空数据库...");
                await scanDir(fileDir, 0, 0);
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
