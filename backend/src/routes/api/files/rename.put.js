const fs = require("fs-extra");
const path = require("path");
const { FileTable } = require("@/modules/sqlite/model");

module.exports = async (ctx) => {
    try {
        const { fileId, newName } = ctx.request.body;
        if (!newName) return ctx.fail("文件名不能为空");

        const srcFile = await FileTable.findOne({ id: fileId });
        if (!srcFile) return ctx.fail("源文件不存在");

        // 当前完整路径
        const srcAbs = path.join(srcFile.rootPath, srcFile.path);

        // 父目录路径
        const parentDir = path.dirname(srcAbs);

        // 新路径
        const destAbs = path.join(parentDir, newName);

        // 检查目标路径是否已存在
        const exists = await fs.pathExists(destAbs);
        if (exists) return ctx.fail("目标名称已存在");

        // 移动 / 重命名
        await fs.move(srcAbs, destAbs, { overwrite: false });

        // 更新自身数据库记录
        const newRelativePath = path.relative(srcFile.rootPath, destAbs);
        await FileTable.update({ id: fileId }, { path: newRelativePath });

        // 如果是目录，更新所有子项路径
        const srcStat = await fs.stat(destAbs);
        if (srcStat.isDirectory()) {
            const children = await FileTable.find([{ field: "path", value: srcFile.path + "%", op: "like" }]);
            for (const child of children) {
                if (!child.path.startsWith(srcFile.path)) continue;
                const relativeChildPath = child.path.slice(srcFile.path.length);
                const updatedChildPath = path.join(newRelativePath, relativeChildPath);
                await FileTable.update({ id: child.id }, { path: updatedChildPath });
            }
        }

        ctx.success("重命名成功");
    } catch (err) {
        ctx.fail("重命名失败: " + err.message);
    }
};
