// 合并文件
const { FileTable, UploadRecord } = require("@/modules/sqlite/model");
const fs = require("fs-extra");
const { buildFileRecord } = require("@/modules/fileSystem/utils");
const path = require("path");
const { pipeline } = require("stream");
const { promisify } = require("util");
const mergingSet = new Set();
module.exports = async (ctx) => {
    const { hash } = ctx.query;
    try {
        if (!hash) throw new Error("hash不能为空");
        if (mergingSet.has(hash)) return ctx.fail("文件正在合并请勿重复请求");
        mergingSet.add(hash);
        const record = await UploadRecord.find([{ field: "hash", value: hash }], { pageSize: -1 });
        if (!record.length) throw new Error("文件不存在");
        const { parentId } = record[0];
        let savePath = "";
        if (parentId != 0) {
            const data = await FileTable.findOne([{ field: "id", value: parentId }]);
            if (!data) throw new Error("合并失败数据路径不存在");
            savePath = path.join(data.rootPath, data.path);
        } else {
            savePath = process.env.PUBLIC_FILE_PATCH;
        }
        await fs.ensureDir(savePath);
        const filePath = await merge(record, savePath)
        await UploadRecord.deleteMany([{ field: "hash", value: hash }]).catch(() => { });
        await fs.rm(path.join(process.env.UPLOAD_TEMP_DIR, hash), { recursive: true }).catch(() => { });
        const newRecord = await buildFileRecord(filePath, parentId);
        newRecord.hash = hash;
        console.log(newRecord);
        await FileTable.insert(newRecord)
        mergingSet.delete(hash);
        ctx.success("合并完成")
    } catch (error) {
        mergingSet.delete(hash);
        ctx.fail("合并失败：" + error.message)
    }


};

async function merge(files, savePath) {
    const pipe = promisify(pipeline);
    // 1️⃣ 排序
    files.sort((a, b) => a.chunkIndex - b.chunkIndex);
    // 2️⃣ 最终文件路径
    const finalPath = path.join(savePath, files[0].filename);
    // 确保目录存在
    // 3️⃣ 创建写入流
    const writeStream = fs.createWriteStream(finalPath);
    try {
        for (const file of files) {
            const chunkPath = file.tempPath;
            // 逐个 chunk 串行写入
            await pipe(
                fs.createReadStream(chunkPath),
                writeStream,
                { end: false } // 不关闭写流
            );
        }
        // 手动关闭写流
        writeStream.end();
        return finalPath;
    } catch (err) {
        writeStream.destroy();
        throw err;
    }
}