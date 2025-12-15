const fs = require("fs-extra");
const path = require("path");
const { FileTable } = require("@/modules/sqlite/model");
const { buildFileRecord } = require("@/modules/fileSystem/utils");
/**
 * 复制文件
 * 
 * @param {Object} ctx - Koa2 Context 对象
 * @param {number} ctx.query.fileId - 文件ID
 * @param {number} ctx.query.destId - 目标文件夹ID
 */

module.exports = async (ctx) => {
    try {
        const { id, destId } = ctx.request.body;
        if (id === destId) return ctx.fail("不能复制到自己的目录");
        const srcFile = await FileTable.findOne({ id });
        if (!srcFile) return ctx.fail("源文件不存在");
        let destFile = { id: 0, rootPath: process.env.PUBLIC_FILE_PATCH, path: "" };
        if (destId != 0) {
            destFile = await FileTable.findOne({ id: destId });
            if (!destFile) return ctx.fail("目标路径不存在");
        }
        const srcAbs = path.join(srcFile.rootPath, srcFile.path);
        const destAbs = path.join(destFile.rootPath, destFile.path, srcFile.name);
        await fs.mkdir(path.dirname(destAbs), { recursive: true });
        const srcStat = await fs.stat(srcAbs);
        await fs.copy(srcAbs, destAbs, { recursive: true, force: true });
        if (srcStat.isFile()) {
            const newRecord = await buildFileRecord(destAbs, await fs.stat(destAbs), destFile.id);
            await FileTable.insert(newRecord);
        } else {
            const children = await FileTable.find([{ field: "path", value: srcFile.path + "%", op: "like" }]);
            const idMap = {};
            for (const child of children) {
                const relative = child.path.replace(srcFile.path, "");
                const newRelPath = path.join(destFile.path, srcFile.name, relative);
                const absNewPath = path.join(destFile.rootPath, newRelPath);
                await fs.mkdir(path.dirname(absNewPath), { recursive: true });
                let parentId = destFile.id;
                if (child.parentId && idMap[child.parentId]) parentId = idMap[child.parentId];
                const newRecord = await buildFileRecord(absNewPath, await fs.stat(absNewPath), parentId);
                const inserted = await FileTable.insert(newRecord);
                idMap[child.id] = inserted.id;
            }
        }
        ctx.success("复制成功");
    } catch (err) {
        ctx.fail("复制失败: " + err.message);
    }
};

