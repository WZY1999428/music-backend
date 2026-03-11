// 上传文件
const { UploadRecord } = require("@/modules/sqlite/model");
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

const multer = require('@koa/multer');
const upload = multer();
const uploadTempDir = process.env.UPLOAD_TEMP_DIR
module.exports = [upload.single('file'), async ctx => {
    const { hash, index, parentId, chunkHash, filename, relativePath } = ctx.request.body;
    if (!filename) throw new Error("文件名不能为空");
    if (!hash) throw new Error("hash不能为空");
    if (!chunkHash) throw new Error("chunkHash不能为空");
    try {
        const tempPath = path.join(uploadTempDir, genFileHash(hash, relativePath || filename), `${genFileHash(chunkHash, relativePath || filename)}.temp`);
        await fs.outputFile(tempPath, ctx.request.file.buffer);
        await UploadRecord.upsert({
            userId: ctx.state.user.userId, // 关联到 users.id
            hash,
            chunkHash,
            chunkIndex: index,
            parentId: parentId || "0",
            tempPath,
            relativePath,
            filename
        }, ["hash", "chunkHash"]);
        ctx.success('上传成功');
    } catch (error) {
        ctx.success(error.message);
    }
}];



function genFileHash(hash, relativePath) {
    const md5 = crypto.createHash('md5');
    md5.update(hash);
    md5.update(relativePath);
    return md5.digest('hex');
}