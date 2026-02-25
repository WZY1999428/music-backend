const fs = require("fs-extra");
const sharp = require('sharp');
const path = require("path");
const { FileTable } = require("@/modules/sqlite/model");

module.exports = async (ctx) => {
    try {
        const id = ctx.params.id
        const file = await FileTable.findOne([
            { field: "id", value: id }
        ])
        if (!file) return ctx.fail("文件不存在");
        const filePath = path.join(file.rootPath, file.path);
        const stat = await fs.stat(filePath)
        if (stat.isDirectory()) {
            return ctx.fail("请选择图片文件");
        } else {
            const outPath = path.join(process.env.THUMB_FILE_PATH, `${file.id}.jpg`);
            if (!await fs.exists(outPath)) await sharp(filePath).resize(200).toFile(outPath);
            const stat = await fs.stat(outPath)
            ctx.set("Accept-Ranges", "bytes")
            ctx.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`)
            ctx.set("Content-Type", "application/octet-stream")
            ctx.set("Content-Length", stat.size)
            ctx.body = fs.createReadStream(outPath)
        }
    } catch (error) {
        ctx.fail(error.message)
    }
}

