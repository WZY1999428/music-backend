// 合并文件
const { FileTable, UploadRecord } = require("@/modules/mongo/model");
const fs = require("fs-extra");
const path = require("path");
const { buildFileRecord, ensureDirRecord, createClosurePaths } = require("@/modules/fileSystem/utils");
const mergingSet = new Set();
const fileDir = process.env.PUBLIC_FILE_PATCH;
module.exports = async (ctx) => {
    const { hash } = ctx.query;
    let newRecord
    try {
        if (!hash) throw new Error("hash不能为空");
        if (mergingSet.has(hash)) return ctx.fail("文件正在合并请勿重复请求");
        mergingSet.add(hash);
        const record = await UploadRecord.find({ hash }, { pageSize: -1 });
        if (!record.length) throw new Error("文件不存在");
        let { parentId, relativePath, tempPath } = record[0];
        let savePath = "";
        if (relativePath) parentId = await ensureDirRecord(relativePath, parentId);
        if (parentId != 0) {
            const data = await FileTable.findOne({ id: parentId });
            if (!data) throw new Error("合并失败数据路径不存在");
            savePath = path.join(data.rootPath, data.path);
        } else savePath = fileDir;
        await fs.ensureDir(savePath);
        const filePath = await merge(record, savePath)
        newRecord = await buildFileRecord(filePath, parentId);
        newRecord.hash = hash;
        await FileTable.runInTransaction(async () => {
            const ret = await FileTable.insert(newRecord)
            await createClosurePaths(ret.id, parentId)
        });
        await UploadRecord.deleteMany({ hash }).catch((err) => { });
        await fs.rm(path.parse(tempPath).dir, { recursive: true }).catch(() => { });
        mergingSet.delete(hash);
        ctx.success("合并完成")
    } catch (error) {
        await UploadRecord.deleteMany({ hash }).catch((err) => { });
        mergingSet.delete(hash);
        ctx.fail("合并失败：" + error.message)
    }
};

async function merge(files, savePath) {
    files.sort((a, b) => a.chunkIndex - b.chunkIndex);
    let finalPath = path.join(savePath, files[0].filename);
    if (await fs.pathExists(finalPath)) {
        finalPath = path.join(savePath, `${Date.now()}-${files[0].filename}`);
    }
    const writeStream = fs.createWriteStream(finalPath);
    try {
        for (const file of files) {
            const chunkPath = file.tempPath;
            const content = await fs.readFile(chunkPath);
            const canContinue = writeStream.write(content);
            if (!canContinue) {
                await new Promise(resolve => writeStream.once('drain', resolve));
            }
        }
    } catch (err) {
        writeStream.destroy();
        await fs.rm(finalPath).catch(() => { })
        throw err;
    } finally {
        writeStream.end();
    }

    return await new Promise((resolve, reject) => {
        writeStream.on("close", () => resolve(finalPath));
        writeStream.on("error", reject);
        writeStream.end();
    });
}
