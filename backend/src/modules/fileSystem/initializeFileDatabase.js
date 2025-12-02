const { FileTable } = require("../sqlite/model");
const watchFiles = require("./watchFiles");
const fileDir = process.env.PUBLIC_FILE_PATCH;
const { scanDir } = require("./utils");
module.exports = async function initFileDB() {
    try {
        watchFiles();
        const files = await FileTable.find([
            { field: 'rootPath', value: fileDir },
        ]);
        if (files.length === 0) {
            console.log("初始化文件数据库...");
            await scanDir(fileDir, 0, 0);
            console.log("文件数据库初始化完成");
        }
        return true;
    } catch (err) {
        console.error("初始化文件数据库失败:", err);
        return false;
    }
};

