// 检查文件是否存在
const { UploadRecord } = require("@/modules/sqlite/model");
const fs = require("fs-extra");
const path = require("path");
module.exports = async (ctx) => {
    try {
        const { hash } = ctx.query;
        if (!hash) throw new Error("hash不能为空");
        await UploadRecord.deleteMany([{ field: "hash", value: hash }]);
        await fs.rm(path.join(process.env.UPLOAD_TEMP_DIR, hash), { recursive: true, force: true });
    } catch (error) {
        ctx.fail(error.message)
    }
};