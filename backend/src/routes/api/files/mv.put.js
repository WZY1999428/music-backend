const fs = require("fs-extra");
const path = require("path");
const { FileTable, FilePathTable } = require("@/modules/sqlite/model");
const { createClosurePaths, getFileList } = require("@/modules/fileSystem/utils");

module.exports = async (ctx) => {
    const moved = []; // 用于 rollback
    
    try {
        const { destId = 0, ids = [] } = ctx.request.body;
        if (!ids.length) throw new Error('请选择需要移动的文件');
        if (ids.includes(destId)) throw new Error('不能把自己移动到自己的目录');

        // 目标文件夹信息
        let destFile = { rootPath: process.env.PUBLIC_FILE_PATCH, path: "", id: 0 };
        if (destId != 0) {
            destFile = await FileTable.findOne([{ field: "id", value: destId }]);
            if (!destFile) throw new Error('目标文件夹不存在');
        }
        const targetAbsPath = path.join(destFile.rootPath, destFile.path);
        const targetStat = await fs.stat(targetAbsPath);
        if (!targetStat.isDirectory()) throw new Error('目标路径不是文件夹');

        // 获取要移动的文件
        const files = await FileTable.find([{ field: "id", value: ids, op: "in" }]);

        for (const file of files) {
            const oldAbsPath = path.join(file.rootPath, file.path);
            const newAbsPath = path.join(targetAbsPath, path.basename(file.path));

            // 移动磁盘文件
            await fs.move(oldAbsPath, newAbsPath, { overwrite: true });
            moved.push({ ...file, newPath: path.relative(file.rootPath, newAbsPath) });

            // 数据库操作
            await FileTable.runInTransaction(async () => {
                // 更新 parentId 和 path
                file.parentId = destId;
                file.path = moved[moved.length - 1].newPath;
                await FileTable.update({ id: file.id }, file);

                // 删除旧闭包表路径（除了自己）
                await FilePathTable.deleteMany([
                    { field: "descendant_id", value: file.id },
                    { field: "ancestor_id", op: "!=", value: file.id }
                ]);

                // 建立新的闭包表路径
                await createClosurePaths(file.id, destId);

                // 如果是文件夹，更新子树
                if (file.isFolder) {
                    const children = await getFileList([
                        { field: "ancestor_id", value: file.id },
                        { field: "depth", value: 0, op: ">" }
                    ]);

                    // 按深度排序，父节点先更新
                    children.sort((a, b) => a.depth - b.depth);

                    const idMap = new Map();
                    idMap.set(file.id, file.id);

                    for (const child of children) {
                        // 修正 parentId 和 path
                        child.parentId = idMap.get(child.parentId);
                        child.path = path.join(file.path, path.relative(path.join(file.rootPath, file.path), path.join(child.rootPath, child.path)));
                        await FileTable.update({ id: child.id }, child);
                        // 更新闭包表
                        await FilePathTable.deleteMany([{ field: "descendant_id", value: child.id }, { field: "ancestor_id", op: "!=", value: child.id }]);
                        await createClosurePaths(child.id, child.parentId);

                        idMap.set(child.id, child.id);
                    }
                }
            });
        }

        ctx.success("移动成功");
    } catch (err) {
        console.error(err);
        // rollback
        // if (moved.length) {
        //     for (const file of moved) {
        //         const srcAbs = path.join(file.rootPath, file.newPath);
        //         const destAbs = path.join(file.rootPath, file.path);
        //         await fs.move(srcAbs, destAbs).catch(() => { });
        //     }
        // }
        ctx.fail("移动失败: " + err.message);
    }
};