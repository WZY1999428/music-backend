// const chokidar = require("chokidar");
// const path = require("path");
// const fs = require("fs/promises");
// const { FileTable } = require("../sqlite/model");
// const os = require("os");
// /**
//  Linux/macOS：默认使用系统原生 fs.watch 或 fsevents（macOS），CPU 占用低。
//  Windows：使用轮询 usePolling: true，因为 Windows 的 fs.watch 在某些情况下不可靠。
// */
// const isWindows = os.platform() === "win32" && process.env.WATCH_IS_WINDOWS_POLL == 1;
// const fileDir = process.env.PUBLIC_FILE_PATCH;
// module.exports = function watchFiles() {
//     // // 初始化 watcher
//     const watcher = chokidar.watch(fileDir, {
//         ignored: /(^|[\/\\])\../, // 忽略隐藏文件
//         persistent: true,
//         ignoreInitial: true,        // 启动时不触发 add/addDir 事件
//         usePolling: isWindows,      // Windows 用轮询，其他系统用原生事件
//         interval: 500,              // 轮询间隔，单位 ms
//         binaryInterval: 1000,       // 二进制文件轮询间隔
//     });
//     watcher
//         .on("add", async filePath => {
//             console.log("新增文件:", filePath);
//         })
//         .on("unlink", async filePath => {
//             console.log("删除文件:", filePath);
//         })
//         .on("addDir", async dirPath => {
//             console.log("新增目录:", dirPath);
//             // const stat = await fs.stat(dirPath);
//             // const record = await FileTable.find({ field: "ino", value: stat.ino });
//             // if (record.length) {
//             //     await FileTable.update({ ino: stat.ino }, { path: path.relative(fileDir, dirPath), status: 0 });
//             // } else {
//             //     // await insertFile(dirPath);
//             // }
//         })
//         .on("unlinkDir", async dirPath => {
//             console.log("删除目录:", dirPath);
//             // FileTable.update({
//             //     path: path.relative(fileDir, dirPath),
//             // }, {
//             //     status: 2
//             // });
//             // console.log("删除目录:", dirPath);
//         })

// };


// async function insertFile(filePath) {
//     const rec = await buildFileRecord(dirPath, stat);
//     await FileTable.insert(rec);
// }