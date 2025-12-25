// 将指定 ID 的项目从回收站恢复到原位置。
const { FileTable } = require("@/modules/sqlite/model");
const path = require("path");
const fs = require("fs-extra");
const { buildFileRecord } = require("@/modules/fileSystem/utils");
module.exports = async (ctx) => {
    let isCommit = true;
    try {
        const fileIds = ctx.request.body.fileIds
        if (!Array.isArray(fileIds) || fileIds.length == 0) throw new Error("请选择需要恢复的文件")
        const files = await FileTable.find([{ field: "id", value: fileIds, op: "in" }])
        if (!files.length) throw new Error("恢复失败，文件不存在");
        const renames = [];
        for (const file of files) {
            const fullPathId = file.fullPathId.split("-").map(Number).filter(Boolean)
            fullPathId.pop();
            const parentPath = await FileTable.find([{ field: "id", value: fullPathId, op: "in" }, { field: "status", value: [3, 1], op: "in" }, { field: "isFolder", value: 1 }]);
            if (parentPath.length > 1) {
                const parents = parentPath.filter(item => item.id != file.id).sort((a, b) => b.path.length - a.path.length);
                const newPath = [];
                await FileTable.beginTransaction();
                isCommit = false;
                for (const parent of parents) {
                    const filePath = path.join(parent.path, `../${parent.name}`);
                    if (await fs.exists(path.join(parent.rootPath, filePath))) {
                        const parentDB = await FileTable.findOne([{ field: "path", value: filePath }]);
                        if (parentDB) newPath.push(parentDB);
                        else {
                            const parentAndParent = await FileTable.findOne([{ field: "id", value: parent.parentId }]);
                            const record = {
                                path: filePath,
                                parentId: 0,
                                status: 0,
                                fullPathId: 0
                            }
                            if (parentAndParent) {
                                record.parentId = parentAndParent.id;
                                record.fullPathId = `${parentAndParent.fullPathId}-${parentAndParent.id}`;
                            }
                            const data = await FileTable.insert(record);
                            await FileTable.update({ id: data.id }, { fullPathId: `${record.fullPathId}-${data.id}` });
                            newPath.push(data);
                        }
                    } else {
                        const parentAndParent = await FileTable.findOne([{ field: "id", value: parent.parentId }]);
                        const fullPath = path.join(parent.rootPath, filePath);
                        await fs.mkdir(fullPath);
                        const record = await buildFileRecord(fullPath, await fs.stat(fullPath), parentAndParent ? parentAndParent.id : 0);
                        const data = await FileTable.insert(record);
                        await FileTable.update({ id: data.id }, { fullPathId: `${record.fullPathId}-${data.id}` });
                        newPath.push(data);
                    }
                }
                await FileTable.commit().then(async res => {
                    isCommit = true;
                    const fullPathId = newPath.map(item => item.id).join("-") + "-" + file.id;
                    const pid = newPath[newPath.length - 1].id;
                    await FileTable.updateMany([{ field: "id", value: file.id }], { parentId: pid, status: 0, fullPathId: fullPathId });
                    file.path = path.join(...newPath.map(item => item.name))
                    await rename(file, renames)
                })
            } else {
                await rename(file, renames)
            }
        }
        ctx.success("恢复成功" + (renames.length ? `已存在同名文件以下文件已重新命名 \n${renames.join("\n")}` : ""));
    } catch (error) {
        if (!isCommit) await FileTable.rollback().catch({});
        ctx.fail(error.message)
    }
}


async function rename(file, renames) {
    const existFile = await FileTable.findOne([{ field: "path", value: path.join(file.path, `../${file.name}`) }, { field: "id", value: file.id, op: "!=" }])
    if (existFile) {
        const newName = `${file.name}-还原-${Date.now()}`;
        renames.push(`${file.name} -> ${newName}`);
        file.name = newName;
    }
    if (file.isFolder == 1) {
        const children = await FileTable.find([
            { field: "fullPathId", value: `%-${file.id}-%`, op: "like", logic: "OR" },
            { field: "fullPathId", value: `${file.id}-%`, op: "like" },
            { field: "id", value: file.id, op: "!=" }
        ])
        try {
            await FileTable.beginTransaction();
            const index = file.fullPathId.split('-').map(Number).filter(Boolean).indexOf(file.id)
            for (const cFile of children) { 
                const pathArr = cFile.path.split(path.sep).filter(Boolean);
                pathArr.splice(index, 1, file.name);
                await FileTable.update({ id: cFile.id }, { path: path.join(...pathArr) });
            }
            await FileTable.commit();
        } catch (error) {
            await FileTable.rollback();
            throw error;
        }
    }
    const newPath = path.join(file.path, `../${file.name}`);
    await fs.move(path.join(file.rootPath, file.path), path.join(file.rootPath, newPath));
    await FileTable.updateMany([{ field: "id", value: file.id }], { path: newPath, status: 0, fullPathId: file.fullPathId, parentId: file.parentId, name: file.name });
}  