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
            if (!await fs.exists(path.join(file.rootPath, file.path))) {
                notExistsFiles.push(file.name);
                continue;
            };
            const parents = await FileTable.find([{ field: "id", value: parseParendIds(file.fullPathId), op: "in" }, { field: "isFolder", value: 1 }]);
            if (parents.length == 0 || !parents.some(p => p.status == 3 || p.status == 1)) {
                isCommit = false;
                await FileTable.beginTransaction();
                await rename(file, renames)
                await FileTable.commit();
                isCommit = true;
            } else {
                const nodes = [...parents].sort((a, b) => b.fullPathId.length - a.fullPathId.length);
                let index = nodes.length - 1;
                isCommit = false;
                const mkdirs = [];
                const moveFiles = [];
                try {
                    await FileTable.beginTransaction();
                    for (const node of nodes) {
                        if (node.status == 3 || node.status == 1) {
                            const exist = await FileTable.findOne([{ field: "path", value: path.join(node.path, `../${node.name}`) }, { field: "id", value: node.id, op: "!=" }, { field: "isFolder", value: 1 }]);
                            const existFile = await fs.exists(path.join(node.rootPath, path.join(node.path, `../${node.name}`)));
                            if (exist || existFile) node.name = `${node.name}-还原-${Date.now()}`;
                            else if (node.status == 1) {
                                const record = buildFileRecord(path.join(node.rootPath, path.join(node.path, `../${node.name}`)), node.parentId);
                                const data = await FileTable.insert(record);
                                node.id = data.id;
                                node.fullPathId = node.fullPathId = [...parseParendIds(parent.fullPathId).slice(0, -1), `-${node.id}`].join("-");
                                await FileTable.update({ id: node.id }, { fullPathId: node.fullPathId });
                                mkdirs.push(path.join(node.rootPath, path.join(node.path, `../${node.name}`)));
                            }
                            const children = parents.filter(c => c.fullPathId.includes(`-${node.id}-`));
                            children.forEach(c => c.path = replacePathSegment(c.path, index, node.name));
                            node.oldPath = node.path;
                            node.path = path.join(node.path, `../${node.name}`);;
                            const src = path.join(node.rootPath, node.oldPath);
                            const dest = path.join(node.rootPath, node.path);
                            (src != dest) && moveFiles.push({ src, dest });
                        }
                        index--;
                    }
                    moveFiles.sort((a, b) => b.length - a.length);
                    for (const dir of mkdirs) await fs.mkdir(dir, { recursive: true });
                    for (const f of moveFiles) (f.src != f.dest) && await fs.move(f.src, f.dest);
                    await FileTable.commit();
                } catch (error) {
                    await FileTable.rollback();
                    throw error;
                }
                isCommit = true;
                console.log(nodes);
            }
        }
        ctx.success({
            renames,
            notExistsFiles
        }, "恢复完成");
    } catch (error) {
        console.log(error);
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
            await FileTable.update({ id: cFile.id }, { path: path.join(...pathArr) });
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

