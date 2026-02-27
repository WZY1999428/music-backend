// 上传文件
const { UploadRecord } = require("@/modules/sqlite/model");
const fs = require('fs-extra');
const path = require('path');
const multer = require('@koa/multer');
const upload = multer();
const uploadTempDir = process.env.UPLOAD_TEMP_DIR
module.exports = [upload.single('file'), async ctx => {
    const { hash, index, parentId, chunkHash, filename } = ctx.request.body;
    if (!filename) throw new Error("文件名不能为空");
    if (!hash) throw new Error("hash不能为空");
    if (!chunkHash) throw new Error("chunkHash不能为空");
    try {
        const tempPath = path.join(uploadTempDir, hash, `${chunkHash}.temp`);
        await fs.outputFile(tempPath, ctx.request.file.buffer);
        await UploadRecord.upsert({
            userId: ctx.state.user.userId, // 关联到 users.id
            hash,
            chunkHash,
            chunkIndex: index,
            parentId: parentId || "0",
            tempPath,
            filename
        }, ["hash", "chunkHash"]);
        ctx.success('上传成功');
    } catch (error) {
        ctx.success(error.message);
    }

}];