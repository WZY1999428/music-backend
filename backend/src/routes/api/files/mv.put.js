const fs = require("fs-extra");
const path = require("path");
const { FileTable } = require("@/modules/sqlite/model");
const { parseParendIds } = require("@/modules/fileSystem/utils");

module.exports = async (ctx) => {
    const moved = []
    let isCommit = true;
    try {
        const { destId = 0, ids } = ctx.request.body;
        if (!ids.length) throw new Error('请选择需要移动的文件');
        let destFile = await FileTable.findOne([{ field: "id", value: destId }]);
        if (!destFile && destId !== 0) throw new Error('目标文件夹不存在');
        if (destId == 0) {
            destFile = {
                rootPath: process.env.PUBLIC_FILE_PATCH,
                path: "",
                id: 0,
                fullPathId: "0"
            }
        }

        const destIds = parseParendIds(destFile.fullPathId)
        for (id of ids) {
            const split = destIds.splice(0, destIds.indexOf(id) + 1);
            if (split.includes(id)) throw new Error('不能移动到自己的子文件夹');
        }

        if (destFile.isFolder === 0) throw new Error('目标路径不是文件夹');
        const files = await FileTable.find([{ field: "id", value: ids, op: "in" }], { pageSize: -1 });
        if (!files.length) throw new Error('文件不存在');
        const targetPath = path.join(destFile.rootPath, destFile.path);
        for (const file of files) {
            const srcAbs = path.join(file.rootPath, file.path);
            const destAbs = path.join(targetPath, file.name);
            console.log(`${srcAbs} -> ${destAbs}`);
            file.newPath = path.join(destFile.path, file.name);
            file.newParentId = destId;
            file.newFullPathId = destFile.fullPathId + '-' + file.id;
            await fs.move(srcAbs, destAbs);
            moved.push(file)
        }

        const batchSql = [];
        for (const file of moved) {
            if (file.isFolder == 1) {
                const children = await FileTable.find([{ field: "fullPathId", value: `%-${file.id}-%`, op: "like" }]);
                updateChild(file, children, batchSql)
            }
            batchSql.push({
                filters: [{ field: "id", value: file.id }],
                data: { path: file.newPath, name: file.name, parentId: file.newParentId, fullPathId: file.newFullPathId }
            })
        }
        await FileTable.beginTransaction();
        isCommit = false;
        await FileTable.updateManyBatchIn(batchSql);
        await FileTable.commit();
        isCommit = true;
        ctx.success("移动成功");
    } catch (err) {
        console.log(err);
        if (moved.length) {
            for (const file of moved) {
                const srcAbs = path.join(file.rootPath, file.newPath);
                const destAbs = path.join(file.rootPath, file.path);
                await fs.move(srcAbs, destAbs,).catch(() => { })
            }
        }
        if (!isCommit) await FileTable.rollback();
        ctx.fail("移动失败: " + err.message);
    }
};


function updateChild(parent, children, batchSql) {
    const index = parseParendIds(parent.fullPathId).indexOf(parent.id) + 1;
    for (const cFile of children) {
        const pathArray = cFile.path.split(path.sep);
        pathArray.splice(0, index);
        const arrFullPathId = parseParendIds(cFile.fullPathId);
        arrFullPathId.splice(0, index, parent.newFullPathId);
        batchSql.push({
            filters: [{ field: "id", value: cFile.id }],
            data: { path: path.join(parent.newPath, ...pathArray), fullPathId: arrFullPathId.join('-') }
        })
    }
}