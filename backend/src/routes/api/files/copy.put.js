const fs = require("fs-extra");
const path = require("path");
const { FileTable } = require("@/modules/sqlite/model");
const { buildFileRecord, queueScanning } = require("@/modules/fileSystem/utils");
/**
 * 复制文件
 * 
 * @param {Object} ctx - Koa2 Context 对象
 * @param {number} ctx.query.fileId - 文件ID
 * @param {number} ctx.query.destId - 目标文件夹ID
 */

module.exports = async (ctx) => {
    const cpd = [];
    let isCommit = true;
    const insertQueue = [];
    try {
        const { ids = [], destId } = ctx.request.body;
        if (!ids.length) return ctx.fail("请选择要复制的文件");
        if (ids.includes(destId)) return ctx.fail("不能复制把自己复制到自己的目录");
        const files = await FileTable.find([{ field: "id", value: ids, op: "in" }]);
        if (!files.length) return ctx.fail("源文件不存在");
        let destFile = { fullPathId: "0", id: 0, rootPath: process.env.PUBLIC_FILE_PATCH, path: "" };
        if (destId != 0) {
            destFile = await FileTable.findOne([{ field: "id", value: destId }]);
            if (!destFile) return ctx.fail("目标路径不存在");
        }
        const targetPath = path.join(destFile.rootPath, destFile.path)
        const targetStat = await fs.stat(targetPath);
        if (!targetStat.isDirectory()) return ctx.fail("目标路径不是文件夹");
        const idMap = new Map();
        for (const file of files) {
            const srcAbs = path.join(file.rootPath, file.path);
            const destAbs = path.join(targetPath, file.name);
            await fs.copy(srcAbs, destAbs, { recursive: true });
            const stat = await fs.stat(destAbs);
            const oldId = file.id;
            const record = {
                ...file,
                id: undefined,
                parentId: destFile.id,
                fullPathId: destFile.fullPathId,
                path: path.join(destFile.path, file.name),
                ino: stat.ino
            };
            const { id: newId } = await FileTable.insert(record);
            await FileTable.update(
                { id: newId },
                { fullPathId: `${destFile.fullPathId}-${newId}` }
            );

            idMap.set(oldId, newId);
        }
        await FileTable.beginTransaction();
        isCommit = false;
        for (const file of cpd) {
            delete file.id;
            const data = await FileTable.insert(buildFileRecord(file));
            file.id = data.id
            file.fullPathId = file.fullPathId + "-" + file.id;
            await FileTable.update({ id: file.id }, { fullPathId: file.fullPathId });

            if (file.isFolder == 1) {
                const children = await FileTable.find([{ field: "fullPathId", value: files.map(f => `%-${f.id}-%`), op: "or-like" }]);
                children.sort((a, b) => a.fullPathId.length - b.fullPathId.length);
                for (const child of children) {
                    const oldParentId = child.parentId;
                    const newParentId = idMap.get(oldParentId);
                    if (!newParentId) continue; // 安全兜底
                    const newRecord = buildFileRecord({
                        ...child,
                        id: undefined,
                        parentId: newParentId,
                        fullPathId: `${idMap.get(
                            child.fullPathId.split('-').slice(0, -1).pop()
                        ) || destFile.fullPathId}`,
                    });
                    const { id: newId } = await FileTable.insert(newRecord);
                    await FileTable.update(
                        { id: newId },
                        { fullPathId: `${newRecord.fullPathId}-${newId}` }
                    );

                    idMap.set(child.id, newId);
                }
            }
        }
        await FileTable.commit();
        isCommit = true;
        ctx.success("复制成功");
    } catch (err) {
        if (!isCommit) {
            await FileTable.rollback();
            for (const file of cpd) await fs.remove(path.join(file.rootPath, file.path)).catch(() => { });
            await FileTable.deleteMany([{ field: "id", value: insertQueue.map(f => f.id) }]).catch(() => { });
        }
        ctx.fail("复制失败: " + err.message);
    }
};

