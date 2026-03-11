const { FileTable, Favorite } = require("@/modules/sqlite/model");
const fs = require("fs-extra");
const path = require("path");
const { getFileList, deleteClosurePaths } = require("@/modules/fileSystem/utils");
const removedMap = new Set();
module.exports = async (ctx) => {
    const { fileIds, status } = ctx.request.body;
    try {
        if (!Array.isArray(fileIds) || fileIds.length === 0) throw new Error("无效的文件ID列表");
        // 状态 0 永久删除 1 移动到回收站 
        // FileTable表的status 0 = 正常  // 1 = 回收站  // 2 = 移动/重命名处理中 // 3 = 父级删除但子目录需隐藏
        // 删除永久父节点时 如果子节点有文件在回收站就吧 父节点状态设置为 3 并且重命名为 .+ Date.now() + filename
        const files = await FileTable.find([{ field: "id", value: fileIds, op: "in" }], { pageSize: -1 });
        if (status == 0) {
            for (const file of files) {
                if (!file || removedMap.has(file.id)) continue;
                removedMap.add(file.id);
                if (!await fs.pathExists(path.join(file.rootPath, file.path))) {
                    const files = await getFileList({ filters: [{ field: "ancestor_id", value: file.id }, { field: "depth", value: 0, op: ">=" }] });
                    await removefiles(files)
                    continue;
                }
                const recycleFiles = await getFileList({ filters: [{ field: "ancestor_id", value: file.id }, { field: "depth", value: 0, op: ">" }, { field: "status", value: 1 }] });
                let whiteIds = [];
                if (recycleFiles.length) {
                    whiteIds = await parentToRecycle(file.id, recycleFiles.sort((a, b) => b.depth - a.depth));
                }
                const rmFiles = await getFileList({ filters: [{ field: "ancestor_id", value: file.id }, { field: "depth", value: 0, op: ">" }, { field: "t2.id", value: whiteIds, op: "not in" }] });
                await removefiles(rmFiles)
                if (whiteIds.length) await renameFileName(file, 3)
                else await removefiles([file])
            }
            ctx.success("文件已永久删除");
        } else {
            for (const file of files) await renameFileName(file, 1);
            await FileTable.updateMany([{ field: "id", value: fileIds, op: "in" }, { field: "status", value: 0 }], { status: 1 });
            ctx.success("文件已入回收站");
        }
    } catch (error) {
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
    await fs.move(path.join(file.rootPath, file.path), path.join(file.rootPath, newPath));
    await FileTable.runInTransaction(async () => {
        await FileTable.updateMany([{ field: "id", value: file.id }], { status: status, path: newPath });
        const children = await getFileList({
            filters: [{ field: "ancestor_id", value: file.id }, { field: "depth", value: 0, op: ">" }]
        });
        for (const child of children) {
            const relative = path.relative(oldPath, child.path); // 相对于旧父路径的相对路径
            child.path = path.join(newPath, relative).split(path.sep).join("/");
            await FileTable.updateMany([{ field: "id", value: child.id }], { path: child.path });
            await Favorite.deleteOne({ id: file.id });
        }
    })
}



async function parentToRecycle(parentId, files) {
    const whiteIds = new Set();
    for (const file of files) {
        const chain = await getFileList({
            filters: [{ field: "ancestor_id", value: parentId }, { field: "depth", value: 0, op: ">" }, { field: "depth", value: file.depth, op: "<" }]
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
                filters: [{ field: "ancestor_id", value: file.id }, { field: "depth", value: 0, op: ">" }]
            });
            whiteIds.add(...children.map(f => f.id));
        }
        whiteIds.add(file.id)
    }
    return Array.from(whiteIds);
}

