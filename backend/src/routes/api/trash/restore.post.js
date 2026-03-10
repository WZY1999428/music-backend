// 恢复文件/文件夹到原位置（可回退）
const path = require("path");
const fs = require("fs-extra");
const { FileTable } = require("@/modules/sqlite/model");
const { createClosurePaths, getFileList, updateClosurePaths, deleteClosurePaths, buildFileRecord } = require("@/modules/fileSystem/utils");
const restoremSet = new Set();
module.exports = async (ctx) => {
    //  还原时当前文件 有父节点在回收站 创建父节点再还原
    //  还原时存在同名目录但是子文件没有同名的 还原修改父节点名称
    //  还原时存在同名目录且子文件存在同名的 修改父节点名称
    const { fileIds } = ctx.request.body;
    const notExistFiles = [];
    try {
        const files = await getFileList([{ field: "t1.ancestor_id", value: fileIds, op: "in" }, { field: "t1.depth", value: 0 }, { field: "t2.status", value: 1 }]);
        for (const file of files) {
            if (restoremSet.has(file.id)) continue;
            if (!fs.pathExists(path.join(file.rootPath, file.path))) {
                notExistFiles.push(file.name);
                await FileTable.runInTransaction(async () => {
                    await FileTable.deleteOne({ id: file.id });
                    await deleteClosurePaths(file.id);
                })
                continue
            }
            const parentChain = await getFileList([{ field: "descendant_id", value: file.id }, { field: "t2.id", value: file.id, op: "!=" }], [{ name: 'files', type: 'LEFT JOIN', on: 't2.id = t1.ancestor_id' }]);
            const ids = parentChain.map(item => item.id);
            const removedParent = await FileTable.find([{ field: "id", value: ids, op: "in" }, { field: "status", value: [1, 3], op: "in" }]);
            if (!removedParent.length) {
                await restorePath(file);
                await FileTable.update({ id: file.id }, { status: 0 })
            } else {
                await mkdirParent(file)
            }
        }

        if (notExistFiles.length) {
            ctx.success("还原成功,以下文件不存在已删除：", notExistFiles.join(","));
        } else {
            ctx.success("还原成功");
        }
    } catch (error) {
        ctx.fail("还原失败：" + error.message);
    } finally {
        fileIds.forEach(id => restoremSet.delete(id))
    }
};



async function restorePath(file) {
    const oldPath = file.path
    const newPath = path.join(path.dirname(file.path), file.name);
    await fs.move(path.join(file.rootPath, file.path), path.join(file.rootPath, newPath));
    await FileTable.runInTransaction(async () => {
        await FileTable.updateMany([{ field: "id", value: file.id }], { status: 0, path: newPath });
        const children = await getFileList([{ field: "ancestor_id", value: file.id }, { field: "depth", value: 0, op: ">" }]);
        for (const child of children) {
            const relative = path.relative(oldPath, child.path); // 相对于旧父路径的相对路径
            child.path = path.join(newPath, relative);
            await FileTable.updateMany([{ field: "id", value: child.id }], { path: child.path });
        }
    })
}


async function mkdirParent(file) {
    const pathSplit = file.path.split('/').filter(Boolean);
    pathSplit.pop();
    const pathArr = [];
    const newParentChain = new Map();
    let lastParent = null;
    while (pathSplit.length > 0) {
        pathArr.push(pathSplit.shift())
        const fullPath = pathArr.join('/');
        const parent = await FileTable.findOne([{ field: "path", value: fullPath }]);
        let oldId = parent.id;
        lastParent = parent.parentId;
        delete parent.id;
        if (parent && [1, 3].includes(parent.status)) {
            parent.path = path.join(path.dirname(parent.path), parent.name).split(path.sep).join('/');
            const parent2 = await FileTable.findOne([{ field: "path", value: parent.path }]);
            if (await fs.pathExists(path.join(file.rootPath, parent.path)) && parent2) {
                newParentChain.set(fullPath, { oldId: oldId, newId: parent2.id, pid: lastParent, name: parent.name });
                lastParent = parent2.parentId
            } else {
                const fullPath = path.join(parent.rootPath, parent.path);
                await fs.mkdir(fullPath, { recursive: true });
                const record = await buildFileRecord(fullPath, lastParent)
                record.hash = parent.hash;
                const newParent = await FileTable.insert(record);
                newParentChain.set(fullPath, { oldId: oldId, newId: newParent.id, pid: lastParent });
                lastParent = newParent.parentId
            }
        } else {
            newParentChain.set(fullPath, { oldId: oldId, newId: oldId, pid: lastParent });
        }
    }

    file.parentId = lastParent
    pathArr.push(file.name)
    const newPath = pathArr.join('/');
    await fs.move(path.join(file.rootPath, file.path), path.join(file.rootPath, newPath), { overwrite: true });
    console.log(newPath);
    await FileTable.runInTransaction(async () => {
        for (const [oldId, newId, pid] of newParentChain) {
            if (oldId == newId) continue;
            await deleteClosurePaths(oldId)
            await updateClosurePaths(newId, pid)
            await FileTable.updateMany([{ field: "id", value: newId }], { parentId: pid, status: 0 });
        }
        await FileTable.updateMany([{ field: "id", value: file.id }], { parentId: lastParent, status: 0, path: newPath });
        await updateClosurePaths(file.id, lastParent);
    })
}