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
            filters: { $and: [{ "t1.descendant_id": { $in: fileIds } }, { "t2.status": 1 }] },
            aggs: { groupBy: ["t1.descendant_id"], depth: { $max: "t1.depth" } },
            fields: ["t2.rootPath"]
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
                filters: { descendant_id: file.id, "t1.depth": { $gt: 0 } },
                joins: [{ name: 'files', type: 'LEFT JOIN', on: 't2.id = t1.ancestor_id' }]
            });
            if (!parentChain.some(item => [1, 3].includes(item.status))) {
                await restorePath(file);
                await FileTable.updateOne({ id: file.id }, { status: 0 })
            } else {
                await mkdirParent(file, parentChain)
            }
        }
        ctx.success(notExistFiles.length ? `还原成功, 以下文件不存在已删除： ${notExistFiles.join(",")}` : '还原成功');
    } catch (error) {
        console.error(error);
        ctx.fail("还原失败：" + error.message);
    } finally {
        fileIds.forEach(id => restoremSet.delete(id))
    }
};

//  从下往上找父节点 
//  如果父节点 在回收站 并且子节点在回收站只有一个 恢复父节点 不然就创建新的文件夹在恢复文件
//  如果当前文件有相同文件了 并且子文件没有相同的文件 就移动子文件到新的文件夹，
//  存在相同子文件 那就重新命当前文件夹 文件名-恢复-恢复日期
async function mkdirParent(file, chain) {
    chain.sort((a, b) => a.depth - b.depth);
    let lastFile = file;
    for (const current of chain) {
        if ([3, 1].includes(current.status)) {
            const children = await FileTable.find({ parentId: current.id, status: { $in: [1, 3] } });
            // 有多个子文件在回收站 自己是 站位父节点或者在回收站的父节点
            if (children.length > 1) {
                await mkdir(current)
            } else {
                // 只有一个子文件在回收站还原自己
                current.status = 0;
                lastFile = current
            }
        } else {
            lastFile = current;
        }
    }
    async function mkdir(currentFile) {
        const newPath = path.join(current.path, `../${currentFile.name}`);
        const exeist =await FileTable.findOne({ path: newPath })
        let fullPath = path.join(current.rootPath, newPath)
        // 如果数据库有同名父节点 
        if (exeist) {
            //  不存在文件夹创建文件夹
            if (! await fs.pathExists(fullPath)) await fs.ensureDir(fullPath);
            // 如果数据库存在的父节点 存在相同的子文件
            // 那就重名命名当前父节点名称
            if (await FileTable.findOne({ name: lastFile.name, parentId: exeist.id })) {
                const newName = `恢复-${Date.now()}-${lastFile.name}`;
                fullPath = path.join(fullPath, `../${newName}`)
            } else {
                lastFile.parentId = exeist.id
                lastFile = exeist
                return
            }
        }
        await fs.ensureDir(fullPath);
        const record = await FileTable.insert(buildFileRecord(fullPath, current.parentId))
        lastFile.parentId = record.id;
        lastFile = record
    }

    console.log(chain);
    console.log(file);

}
 

async function restorePath(file) {
    const oldPath = file.path
    const newPath = path.join(file.path, `../${file.name}`);
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

