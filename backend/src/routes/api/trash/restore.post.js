// 将指定 ID 的项目从回收站恢复到原位置。
const { FileTable } = require("@/modules/sqlite/model");
const path = require("path");
const fs = require("fs-extra");
const { buildFileRecord, parseParendIds, replacePathSegment } = require("@/modules/fileSystem/utils");
module.exports = async (ctx) => {
    let isCommit = true;
    try {
        const fileIds = ctx.request.body.fileIds
        if (!Array.isArray(fileIds) || fileIds.length == 0) throw new Error("请选择需要恢复的文件")
        const files = await FileTable.find([{ field: "id", value: fileIds, op: "in" }])
        if (!files.length) throw new Error("恢复失败，文件不存在");
        const renames = [];
        const notExistsFiles = [];
        for (const file of files) {
            if (! await fs.exists(path.join(path.rootPath, file.path))) {
                notExistsFiles.push(file.name);
                continue;
            };

            if (file.parentId == 0) {
                isCommit = false;
                await FileTable.beginTransaction();
                await rename(file, renames)
                await FileTable.commit();
                isCommit = true;
            } else {
                const parents = await FileTable.find([{ field: "id", value: parseParendIds(file.fullPathId), op: "in" }, { field: "isFolder", value: 1 }]);
                parents.sort((a, b) => a.fullPathId.length - b.fullPathId.length);
                const status3 = parents.findIndex(p => p.status == 3 || p.status == 1);
                for (let i = 0; i < parents.length; i++) {
                    const parent = parents[i];
                    if (parent.status == 3 || parent.status == 1) {
                        const exist = await FileTable.findOne([{ field: "path", value: path.join(file.path, `../${file.name}`) }, { field: "id", value: parent.id, op: "!=" }, { field: "isFolder", value: 1 }]);
                        if (exist) {
                            parent.name = `${parent.name}-还原-${Date.now()}`;
                            const children = parents.slice(i + 1);
                            children.forEach(c => c.path = replacePathSegment(c.path, i, parent.name));
                        }
                    }
                }
            }
        }
        // + (renames.length ? `已存在同名文件以下文件已重新命名 \n${renames.join("\n")}` : "" + notExistsFiles.length ? `\n${notExistsFiles}。文件不存在，不可恢复` : "")
        ctx.success("恢复完成", {
            renames,
            notExistsFiles
        });
    } catch (error) {
        if (!isCommit) await FileTable.rollback().catch({});
        ctx.fail(error.message)
    }
}


async function updateChild(file) {
    const children = await FileTable.find([
        { field: "fullPathId", value: `%-${file.id}-%`, op: "like", logic: "OR", groupStart: true },
        { field: "fullPathId", value: `-${file.id}%`, op: "like", groupEnd: true },
        { field: "id", value: file.id, op: "!=" }
    ])
    try {
        const index = parseParendIds(file.fullPathId).indexOf(file.id)
        for (const cFile of children) {
            const pathArr = cFile.path.split(path.sep).filter(Boolean);
            pathArr.splice(index, 1, file.name);
            // await FileTable.update({ id: cFile.id }, { path: path.join(...pathArr) });
        }
    } catch (error) {
        throw error;
    }
}


async function rename(file, renames) {
    const existFile = await FileTable.findOne([{ field: "path", value: path.join(file.path, `../${file.name}`) }, { field: "id", value: file.id, op: "!=" }])
    if (existFile) {
        const newName = `${file.name}-还原-${Date.now()}`;
        renames.push(`${file.name} -> ${newName}`);
        file.name = newName;
    }
    if (file.isFolder == 1) await updateChild(file);
    let newPath = path.join(file.path, `../${file.name}`);
    if (file.parentId != 0) {
        const parent = await FileTable.findOne([{ field: "id", value: file.parentId }]);
        newPath = path.join(parent.path, file.name);
    }
    const q = [{ field: "id", value: file.id }];
    const up = { path: newPath, status: 0, fullPathId: file.fullPathId, parentId: file.parentId, name: file.name }
    try {
        const src = path.join(file.rootPath, file.path)
        const dest = path.join(file.rootPath, newPath)
        if (src == dest) {
            await FileTable.updateMany(q, up);
            return
        }
        await fs.move(src, dest)
        await FileTable.updateMany(q, up);
    } catch (error) {
        throw error;
    }
}

