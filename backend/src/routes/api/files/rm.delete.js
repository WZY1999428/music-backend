const { FileTable, Favorite } = require("@/modules/mongo/model");
const fs = require("fs-extra");
const path = require("path");
const { getFileList, deleteClosurePaths } = require("@/modules/fileSystem/utils");
const removedMap = new Set();
module.exports = async (ctx) => {
    const { fileIds, status = 1 } = ctx.request.body;
    try {
        if (!Array.isArray(fileIds) || fileIds.length === 0) throw new Error("无效的文件ID列表");
        // 状态 0 永久删除 1 移动到回收站 
        // FileTable表的status 0 = 正常  // 1 = 回收站  // 2 = 移动/重命名处理中 // 3 = 父级删除但子目录需隐藏
        // 删除永久父节点时 如果子节点有文件在回收站就吧 父节点状态设置为 3 并且重命名为 .+ Date.now() + filename
        const files = await FileTable.find({ id: { $in: fileIds } }, { pageSize: 0 });
        console.log(files);
        console.log(status);

        if (status == 0) {
            for (const file of files) {
                if (removedMap.has(file.id)) continue;
                removedMap.add(file.id);
                if (!await fs.pathExists(path.join(file.rootPath, file.path))) {
                    const files = await getFileList({
                        filters: { ancestor_id: file.id, depth: { $gte: 0 } },
                        pageSize: 0,
                        fields: ["t2.rootPath"]
                    });
                    await removefiles(files)
                    continue;
                }
                const recycleFiles = await getFileList({
                    filters: { ancestor_id: file.id, depth: { $gt: 0 }, status: 1 },
                    pageSize: 0,
                    fields: ["t2.rootPath"]
                });
                let whiteIds = [];
                if (recycleFiles.length) {
                    whiteIds = await parentToRecycle(file.id, recycleFiles.sort((a, b) => b.depth - a.depth));
                }
                const rmFiles = await getFileList({
                    filters: { ancestor_id: file.id, depth: { $gt: 0 }, t2: { id: { $nin: whiteIds } } },
                    pageSize: 0,
                    fields: ["t2.rootPath"]
                });
                await removefiles(rmFiles)
                if (whiteIds.length) await renameFileName(file, 3)
                else await removefiles([file])
            }
            ctx.success("文件已永久删除");
        } else {
            for (const file of files) await renameFileName(file, 1);
            ctx.success("文件已入回收站");
        }
    } catch (error) {
        console.log(error);
        ctx.fail(error.message);
    } finally {
        fileIds.forEach(id => removedMap.delete(id));
    }
}


async function removefiles(files) {
    files.sort((a, b) => b.path.length - a.path.length);
    for (const file of files) {
        await fs.remove(path.join(file.rootPath, file.path)).catch({});
        await FileTable.runInTransaction(async () => {
            await FileTable.deleteOne({ id: file.id })
            await deleteClosurePaths(file.id);
            await Favorite.deleteOne({ id: file.id });
        }).catch({})
    }
}

async function renameFileName(file, status = 3) {
    const oldPath = file.path
    const name = `.${Date.now()}-${file.name}`;
    const newPath = path.join(path.dirname(file.path), name);
    const OldFullPath = path.join(file.rootPath, oldPath);
    const newFullPath = path.join(file.rootPath, newPath);
    await fs.move(OldFullPath, newFullPath);
    await FileTable.runInTransaction(async () => {
        await FileTable.updateOne({ id: file.id }, { status, path: newPath });
        const children = await getFileList({
            filters: { ancestor_id: file.id, depth: { $gt: 0 } },
            pageSize: 0,
            fields: ["t2.rootPath"]
        });
        const updates = [];
        const deletes = [];
        for (const child of children) {
            const relative = path.relative(oldPath, child.path); // 相对于旧父路径的相对路径
            child.path = path.join(newPath, relative).split(path.sep).join("/");
            deletes.push(child.id);
            updates.push({ id: child.id, path: child.path });
        }
        await FileTable.updateBranch(updates);
        await Favorite.deleteMany({ id: { $in: deletes } });
    }).catch(e => {
        fs.move(newFullPath, OldFullPath);
        throw e
    })
}


async function parentToRecycle(parentId, files) {
    const whiteIds = new Set();
    for (const file of files) {
        const chain = await getFileList({
            fields: ["t2.rootPath"],
            pageSize: 0,
            filters: {
                ancestor_id: parentId,
                $and: [
                    { depth: { $gt: 0 } },
                    { depth: { $lt: file.depth } }
                ]
            }
        });
        chain.sort((a, b) => b.depth - a.depth);
        let currentId = file.parentId;
        for (const f of chain) {
            if (f.id == currentId) {
                whiteIds.add(f.id);
                currentId = f.parentId;
            }
        }
        if (file.isFolder == 1) {
            const children = await getFileList({
                filters: { ancestor_id: file.id, depth: { $gt: 0 } },
                pageSize: 0,
                fields: ["t2.rootPath"]
            });
            whiteIds.add(...children.map(f => f.id));
        }
        whiteIds.add(file.id)
    }
    return Array.from(whiteIds);
}

