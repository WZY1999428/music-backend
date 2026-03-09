// 恢复文件/文件夹到原位置（可回退）
const { FileTable } = require("@/modules/sqlite/model");
const path = require("path");
const fs = require("fs-extra");
const { replacePathSegmentByName, parseParendIds, replacePathSegment } = require("@/modules/fileSystem/utils");

module.exports = async (ctx) => {
    const moved = [];
    const mkdirs = [];
    const renames = [];
    const notExistsFiles = [];
    let transactionStarted = false;

    try {
        const fileIds = ctx.request.body.fileIds;
        if (!Array.isArray(fileIds) || fileIds.length === 0) throw new Error("请选择需要恢复的文件");

        const files = await FileTable.find([{ field: "id", value: fileIds, op: "in" }]);
        if (!files.length) throw new Error("恢复失败，文件不存在");

        for (const file of files) {
            const fileFullPath = path.join(file.rootPath, file.path);
            if (!await fs.exists(fileFullPath)) {
                notExistsFiles.push(file.name);
                continue;
            }
            // 查找父节点
            const parentIds = parseParendIds(file.fullPathId);
            const parents = await FileTable.find([
                { field: "id", value: parentIds, op: "in" },
                { field: "isFolder", value: 1 }
            ]);

            // 父节点不存在或不可恢复，直接重命名自己
            if (!parents.length || !parents.some(p => p.status === 3 || p.status === 1)) {
                await simpleRename(file, renames);
                continue;
            }

            // 按深度从深到浅排序，先处理子目录
            const nodes = [...parents].sort((a, b) => b.fullPathId.length - a.fullPathId.length);
            const moveFiles = [];
            const deleteIds = [];
            try {
                await FileTable.beginTransaction();
                transactionStarted = true;
                // 处理每个节点
                for (const node of nodes) {
                    if (node.status !== 3 && node.status !== 1) continue;
                    const targetPath = replacePathSegmentByName(node.path, node.name)
                    const exist = await FileTable.findOne([
                        { field: "path", value: targetPath },
                        { field: "id", value: node.id, op: "!=" },
                        { field: "isFolder", value: 1 }
                    ]);
                    const existFile = await fs.exists(path.join(node.rootPath, targetPath));
                    if (exist && existFile) {
                        const existChild = await FileTable.find([
                            { field: "fullPathId", value: `%-${exist.id}-%`, op: "like" },
                            { field: "id", value: exist.id, op: "!=" }
                        ]);
                        if (existChild.length) node.name = `${node.name}-还原-${Date.now()}`;
                        else deleteIds.push(exist.id);
                    } else if (node.status === 1) { mkdirs.push(node); }
                    const children = parents.filter(c => c.fullPathId.includes(`-${node.id}-`));
                    children.forEach(c => c.path = replacePathSegment(c.path, 0, node.name));
                    node.oldPath = node.path;
                    node.path = targetPath;
                    if (node.path !== targetPath) moveFiles.push({ id: node.id, oldPath: node.path, newPath: targetPath });
                }
                // 处理当前文件
                const lastParent = parents[parents.length - 1];
                file.parentId = lastParent.id;
                file.fullPathId = `${lastParent.fullPathId}-${file.id}`;
                file.newPath = path.join(lastParent.path, file.name);
                moveFiles.push({ id: file.id, oldPath: file.path, newPath: file.newPath });
                // 创建目录
                for (const dir of mkdirs) {
                    await fs.mkdir(path.join(dir.rootPath, replacePathSegmentByName(dir.path, dir.name)), { recursive: true });
                    const stat = await fs.stat(dir.path);
                    dir.id = null;
                    dir.path = replacePathSegmentByName(dir.path, dir.name)
                    dir.ino = stat.ino;
                    await FileTable.insert(dir);
                }
                // 移动文件
                const pathMap = new Map(); // 记录已发生的路径变化
                const rootPath = file.rootPath;
                for (const f of moveFiles) {
                    let src = f.oldPath;
                    let dest = f.newPath;
                    // 如果父目录已经被移动过，修正路径
                    for (const [oldBase, newBase] of pathMap) {
                        if (src.startsWith(oldBase)) {
                            src = src.replace(oldBase, newBase);
                            dest = dest.replace(oldBase, newBase);
                        }
                    }
                    const absSrc = path.join(rootPath, src);
                    const absDest = path.join(rootPath, dest);
                    if (absSrc !== absDest) {
                        await fs.move(absSrc, absDest, { overwrite: true });
                        pathMap.set(src, dest);
                        moved.unshift({ src: absSrc, dest: absDest });
                    }
                }

                // 更新数据库
                const batchSql = parents.map(node => ({
                    filters: [{ field: "id", value: node.id }],
                    data: { path: node.path, name: node.name, status: 0 }
                }));
                batchSql.push({
                    filters: [{ field: "id", value: file.id }],
                    data: { path: file.newPath, name: file.name, parentId: file.parentId, fullPathId: file.fullPathId, status: 0 }
                });
                await FileTable.updateManyBatchIn(batchSql);
                if (file.isFolder === 1) await updateChild(file);
                await FileTable.deleteMany([{ field: "id", value: deleteIds, op: "in" }]);

                await FileTable.commit();
                transactionStarted = false;
            } catch (err) {
                // 回退文件 & mkdir & 数据库
                for (const f of moved) await fs.move(f.dest, f.src).catch(() => { });
                for (const d of mkdirs) await fs.rmdir(d.path, { recursive: true }).catch(() => { });
                await FileTable.rollback().catch(() => { });
                throw err;
            }
        }

        ctx.success({ renames, notExistsFiles }, "恢复完成");
    } catch (err) {
        if (transactionStarted) await FileTable.rollback().catch(() => { });
        ctx.fail(err.message);
    }
};

// 简单重命名单文件（父目录不存在时，自动处理冲突）
async function simpleRename(file, renames) {
    let newName = file.name;
    const parentDir = path.join(file.rootPath, path.dirname(file.path));
    let targetPath = path.join(parentDir, newName);

    // 如果存在同名文件，自动加后缀
    while (await fs.exists(targetPath)) {
        const timestamp = Date.now();
        newName = `${file.name}-还原-${timestamp}`;
        targetPath = path.join(parentDir, newName);
    }

    // 执行移动
    await fs.move(path.join(file.rootPath, file.path), targetPath);

    // 更新文件信息
    renames.push(`${file.name} -> ${newName}`);
    file.name = newName;
    file.path = path.relative(file.rootPath, targetPath);
    await FileTable.update({ id: file.id }, { name: file.name, path: file.path , status: 0});
}


// 更新子文件路径
async function updateChild(file) {
    const children = await FileTable.find([
        { field: "fullPathId", value: `%-${file.id}-%`, op: "like" },
        { field: "fullPathId", value: `-${file.id}%`, op: "like" },
        { field: "id", value: file.id, op: "!=" }
    ]);
    const index = parseParendIds(file.fullPathId).indexOf(file.id);

    for (const cFile of children) {
        const pathArr = cFile.path.split(path.sep).filter(Boolean);
        pathArr.splice(index, 1, file.name);
        await FileTable.update({ id: cFile.id }, { path: path.join(...pathArr) });
    }
}

