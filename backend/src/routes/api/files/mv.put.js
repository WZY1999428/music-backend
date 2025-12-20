const fs = require("fs-extra");
const path = require("path");
const { FileTable } = require("@/modules/sqlite/model");

module.exports = async (ctx) => {
    try {
        const { fileId, destId } = ctx.request.body
        if (fileId === destId) return ctx.fail("不能移动到自己的目录");
        const srcFile = await FileTable.findOne({ id: fileId });
        if (!srcFile) return ctx.fail("源文件不存在");
        // 根路径（虚拟根）
        let destFile = { id: 0, rootPath: process.env.PUBLIC_FILE_PATCH, path: "" };
        if (destId != 0) {
            destFile = await FileTable.findOne({ id: destId });
            if (!destFile) return ctx.fail("目标路径不存在");
        }
        const srcAbs = path.join(srcFile.rootPath, srcFile.path);
        const destAbs = path.join(destFile.rootPath, destFile.path, srcFile.name);
        // 确保目标目录存在
        await fs.mkdir(path.dirname(destAbs), { recursive: true });
        const srcStat = await fs.stat(srcAbs);
        await fs.move(srcAbs, destAbs, { overwrite: true },);
        await FileTable.update({ id: fileId }, {
            path: path.relative(destFile.rootPath, destAbs),
            parentId: destFile.id
        });
        if (srcStat.isDirectory()) {
            const children = await FileTable.find([{ field: "path", value: srcFile.path + "%", op: "like" }],{
                pageSize: -1
            });
            for (const child of children) {
                if (!child.path.startsWith(srcFile.path)) continue;
                const relative = child.path.slice(srcFile.path.length);
                const newRelChild = path.relative(destFile.rootPath, path.join(destFile.rootPath, destFile.path, srcFile.name, relative));
                await FileTable.update({ id: child.id }, {
                    path: newRelChild
                });
            }
        }
        ctx.success("移动成功");
    } catch (err) {
        ctx.fail("移动失败: " + err.message);
    }
};
