// 恢复文件/文件夹到原位置（可回退）
const path = require("path");
const fs = require("fs-extra");
const { FileTable } = require("@/modules/mongo/model");
const { getFileList, updateClosurePaths, deleteClosurePaths, buildFileRecord } = require("@/modules/fileSystem/utils");
const restoremSet = new Set();
module.exports = async (ctx) => {
    //  还原时当前文件 有父节点在回收站 创建父节点再还原
    //  还原时存在同名目录但是子文件没有同名的 还原修改父节点名称
    //  还原时存在同名目录且子文件存在同名的 修改父节点名称
    const { fileIds } = ctx.request.body;
    const notExistFiles = [];
    try {
        const files = await getFileList({
            filters: [{ field: "t1.ancestor_id", value: fileIds, op: "in" }, { field: "t1.depth", value: 0 }, { field: "t2.status", value: 1 }]
        });
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
            const parentChain = await getFileList({
                filters: [{ field: "descendant_id", value: file.id }, { field: "t2.id", value: file.id, op: "!=" }],
                joins: [{ name: 'files', type: 'LEFT JOIN', on: 't2.id = t1.ancestor_id' }]
            });
            const ids = parentChain.map(item => item.id);
            const removedParent = await FileTable.find({ $and: [{ id: { $in: ids }, status: { $in: [1, 3] } }] });
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
    const oldFullPath = path.join(file.rootPath, file.path);
    const newFullPath = path.join(file.rootPath, newPath);
    await fs.move(oldFullPath, newFullPath);
    await FileTable.runInTransaction(async () => {
        await FileTable.updateMany({ id: file.id }, { status: 0, path: newPath });
        const children = await getFileList({ filters: { ancestor_id: file.id, depth: { $gt: 0 } } });
        for (const child of children) {
            const relative = path.relative(oldPath, child.path); // 相对于旧父路径的相对路径
            child.path = path.join(newPath, relative);
            await FileTable.updateMany({ id: child.id }, { path: child.path });
        }
    }).catch(e => {
        fs.move(newFullPath, oldFullPath);
        throw e
    })
}


async function mkdirParent(file) {
    console.log(file);
    //  从上往下找父节点 如果父节点 在回收站 就创建新的文件夹在恢复文件
    //  如果当前文件有相同文件了那就重新命名文件  文件名-恢复-恢复日期
    const files = await getFileList({
        filters: { ancestor_id: file.id, depth: { $lt: file.depth } },
        fields: ["t2.rootPath"]
    })
    console.log(files);


    

}