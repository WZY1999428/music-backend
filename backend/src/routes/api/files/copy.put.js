const fs = require("fs-extra");
const path = require("path");
const { FileTable, FilePathTable } = require("@/modules/sqlite/model");
const { buildFileRecord, createClosurePaths, normalizePathForDB, getFileList } = require("@/modules/fileSystem/utils");
/**
 * 复制文件
 * 
 * @param {Object} ctx - Koa2 Context 对象
 * @param {number} ctx.query.fileId - 文件ID
 * @param {number} ctx.query.destId - 目标文件夹ID
 */

module.exports = async (ctx) => {
    const insertQueue = [];
    const copydFile = [];
    try {
        const { ids = [], destId } = ctx.request.body;
        if (!ids.length) return ctx.fail("请选择要复制的文件");
        if (ids.includes(destId)) return ctx.fail("不能复制把自己复制到自己的目录");
        const files = await FileTable.find([{ field: "id", value: ids, op: "in" }]);
        if (!files.length) return ctx.fail("源文件不存在");
        let destFile = { id: 0, rootPath: process.env.PUBLIC_FILE_PATCH, path: "" };
        if (destId != 0) {
            destFile = await FileTable.findOne([{ field: "id", value: destId }]);
            if (!destFile) return ctx.fail("目标路径不存在");
        }
        const targetPath = path.join(destFile.rootPath, destFile.path)
        const targetStat = await fs.stat(targetPath);
        if (!targetStat.isDirectory()) return ctx.fail("目标路径不是文件夹");
        for (const file of files) {
            const sourcePath = path.join(file.rootPath, file.path);
            const newPath = path.join(targetPath, path.basename(file.path));
            await fs.copy(sourcePath, newPath, { dereference: false });
            file.parentId = destId;
            await FileTable.runInTransaction(async () => {
                const oldId = file.id;
                delete file.id;
                file.path = normalizePathForDB(process.env.PUBLIC_FILE_PATCH, newPath);
                const newFile = await FileTable.insert(file);
                await createClosurePaths(newFile.id, destId);
                copydFile.push(file);
                insertQueue.push(oldId);
                if (file.isFolder) {
                    const idMap = new Map();
                    idMap.set(oldId, newFile.id);
                    const children = await getFileList([{ field: "ancestor_id", value: oldId }, { field: "depth", value: 0, op: ">" }])
                    for (const childFile of children.sort((a, b) => a.depth - b.depth)) {
                        const newParentId = idMap.get(childFile.parentId);
                        const oldChildId = childFile.id;
                        delete childFile.id;
                        childFile.parentId = newParentId;
                        childFile.path = path.join(targetPath, path.relative(path.join(file.rootPath, file.path), path.join(childFile.rootPath, childFile.path)));
                        const newChildFile = await FileTable.insert(childFile);
                        await createClosurePaths(newChildFile.id, newParentId);
                        idMap.set(oldChildId, newChildFile.id);
                    }
                }
            })
        }
        ctx.success("复制成功");
    } catch (err) {
        for (const file of copydFile) await fs.remove(path.join(file.rootPath, file.path)).catch(() => { });
        await FileTable.deleteMany([{ field: "id", value: insertQueue, op: "in" }]).catch(() => { });
        await FilePathTable.deleteMany([{ field: "ancestor_id", value: insertQueue, op: "in" }]).catch(() => { })
        ctx.fail("复制失败: " + err.message);
    }
};

