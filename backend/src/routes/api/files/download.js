const fs = require("fs-extra");
const path = require("path");
const { FileTable } = require("@/modules/sqlite/model");
const archiver = require("archiver");

/**
 * 下载文件
 * @param {Object} ctx - Koa2 Context 对象
 * @param {number} ctx.query.fileId - 文件ID
 */

module.exports = async (ctx) => {
    try {
        const id = ctx.query.fileId
        if (id == 0) {
            // 下载根目录下的所有文件
            await zipDirectory(process.env.PUBLIC_FILE_PATCH, ctx, n = Date.now() + ".zip");
            return;
        }
        const file = await FileTable.findOne({ id })
        if (!file) return ctx.fail("文件不存在");
        const filePath = path.join(file.rootPath, file.path);
        const stat = await fs.stat(filePath)
        if (stat.isDirectory()) {
            // 下载文件夹
            await zipDirectory(filePath, ctx, file.name + ".zip");
        } else {
            // 下载文件
            ctx.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
            ctx.set("Content-Type", "application/octet-stream");
            ctx.body = fs.createReadStream(filePath);
        }
    } catch (error) {
        ctx.fail(error.message)
    }
}


/**
 * 压缩文件夹
 * @param {string} srcDir - 文件夹路径
 * @param {Object} ctx - Koa2 Context 对象
 * @param {string} zipName - 压缩文件名
 */

async function zipDirectory(srcDir, ctx, zipName) {
    const absPath = path.resolve(srcDir);
    const folderName = path.basename(absPath);
    ctx.status = 200;
    ctx.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(zipName)}`);
    ctx.set("Content-Type", "application/zip");
    ctx.respond = false; //  告诉 Koa 不要自动处理响应
    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", err => { throw err; });
    archive.on("warning", warn => console.warn(warn));
    archive.on("close", () => console.log("压缩完成:", archive.pointer(), "字节"));
    archive.on("end", () => console.log("压缩流写入完成"));
    archive.pipe(ctx.res);
    archive.directory(absPath, folderName); // 保留顶级目录
    await archive.finalize();
}
