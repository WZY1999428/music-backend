// 获取回收站中的所有项目列表。
const { FileTable } = require("@/modules/sqlite/model");
const fs = require('fs-extra');
const path = require('path');
const multer = require('@koa/multer');
const upload = multer();
const uploadTempDir = process.env.UPLOAD_TEMP_DIR
module.exports = [upload.single('file'), async ctx => {
    const { hash, index, savePath, chunkHash } = ctx.request.body;
    ctx.success('上传成功');
    try {
        await fs.outputFile(path.join(uploadTempDir, hash, `${chunkHash}.temp`), ctx.request.file.buffer);
        ctx.success('上传成功');
    } catch (error) {
        ctx.success(error.message);
    }

}];