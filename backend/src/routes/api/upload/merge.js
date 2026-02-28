// 合并文件
const { FileTable, UploadRecord } = require("@/modules/sqlite/model");
const fs = require("fs-extra");
const { buildFileRecord } = require("@/modules/fileSystem/utils");
const path = require("path");
const mergingSet = new Set();
const fileDir = process.env.PUBLIC_FILE_PATCH;
module.exports = async (ctx) => {
    const { hash } = ctx.query;
    let newRecord
    try {
        if (!hash) throw new Error("hash不能为空");
        if (mergingSet.has(hash)) return ctx.fail("文件正在合并请勿重复请求");
        mergingSet.add(hash);
        const record = await UploadRecord.find([{ field: "hash", value: hash }], { pageSize: -1 });
        if (!record.length) throw new Error("文件不存在");
        let { parentId, relativePath } = record[0];
        if (relativePath) parentId = await createDir(relativePath, parentId);
        let savePath = "";
        let fullPathId = "";
        if (parentId != 0) {
            const data = await FileTable.findOne([{ field: "id", value: parentId }]);
            if (!data) throw new Error("合并失败数据路径不存在");
            savePath = path.join(data.rootPath, data.path);
            fullPathId = data.fullPathId
        } else savePath = fileDir;

        await fs.ensureDir(savePath);
        const filePath = await merge(record, savePath)
        await UploadRecord.deleteMany([{ field: "hash", value: hash }]).catch(() => { });
        await fs.rm(path.join(process.env.UPLOAD_TEMP_DIR, hash), { recursive: true }).catch(() => { });
        newRecord = await buildFileRecord(filePath, parentId);
        newRecord.hash = hash;
        const ret = await FileTable.insert(newRecord)
        await FileTable.update({ id: ret.id }, { fullPathId: `${fullPathId}-${ret.id}` })
        mergingSet.delete(hash);
        ctx.success("合并完成")
    } catch (error) {
        mergingSet.delete(hash);
        ctx.fail("合并失败：" + error.message)
    }
};

async function createDir(relativePath, parentId) {
    const parsePath = path.parse(relativePath);
    const dirs = parsePath.dir.split(path.sep).filter(Boolean);
    let fullPathId = "0-";
    if (dirs.length) {
        let dirPath
        if (parentId != 0) {
            const parent = await FileTable.findOne([{ field: "id", value: parentId }]);
            dirPath = path.join(parent.rootPath, parent.path);
            fullPathId = parent.fullPathId
        } else dirPath = fileDir

        for (const dir of dirs) {
            dirPath = path.join(dirPath, dir);
            const parent = await FileTable.findOne([{ field: "path", value: path.relative(fileDir, dirPath) }]);
            if (!await fs.pathExists(dirPath) || !parent) {
                await fs.ensureDir(dirPath);
                const record = await buildFileRecord(dirPath, parentId);
                const ret = await FileTable.insert(record);
                console.log(record);
                await FileTable.update({ id: ret.id }, { fullPathId: `${fullPathId}-${ret.id}` })
                parentId = ret.id
            } else {
                parentId = parent.id
            }
        }
    }
    return parentId
}


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
            // 1. 直接读取整个分片到 Buffer
            const content = await fs.readFile(chunkPath);
            // 2. 写入并检查背压
            const canContinue = writeStream.write(content);
            // 3. 如果写入缓冲区满了，等待磁盘干完活再读下一个
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

    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(finalPath));
        writeStream.on('error', reject);
    });
}