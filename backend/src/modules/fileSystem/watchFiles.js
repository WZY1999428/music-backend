const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs/promises");
const { FileTable } = require("../sqlite/model");
const fileDir = process.env.PUBLIC_FILE_PATCH;
module.exports = function watchFiles() {
    // // 初始化 watcher
    const watcher = chokidar.watch(fileDir, {
        ignored: /(^|[\/\\])\../, // 忽略隐藏文件
        persistent: true,
        ignoreInitial: true,      // 启动时不触发 add 事件
        depth: 4,                   // 只监听 4 层
        awaitWriteFinish: {
            stabilityThreshold: 200,
            pollInterval: 100
        }
    });
    watcher
        .on("add", async filePath => {
            console.log("新增文件:", filePath);
        })
        .on("unlink", async filePath => {
            console.log("删除文件:", filePath);
        })
        .on("addDir", async dirPath => {
            console.log(11111111111);
            // const stat = await fs.stat(dirPath);
            // const record = await FileTable.find({ field: "ino", value: stat.ino });
            // if (record.length) {
            //     await FileTable.update({ ino: stat.ino }, { path: path.relative(fileDir, dirPath), status: 0 });
            // } else {
            //     // await insertFile(dirPath);
            // }
        })
        .on("unlinkDir", async dirPath => {
            // FileTable.update({
            //     path: path.relative(fileDir, dirPath),
            // }, {
            //     status: 2
            // });
            console.log("删除目录:", dirPath);
        })
    // setInterval(() => {
    //     FileTable.deleteMany({
    //         status: 2
    //     })
    // }, 1000 * 60);

};


async function insertFile(filePath) {
    const rec = await buildFileRecord(dirPath, stat);
    await FileTable.insert(rec);
}