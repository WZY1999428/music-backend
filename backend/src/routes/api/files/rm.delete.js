const { FileTable, Favorite } = require("@/modules/sqlite/model");
const fs = require("fs-extra");
const path = require("path");
const { parseParendIds, getFileList } = require("@/modules/fileSystem/utils");
module.exports = async (ctx) => {
    try {
        const { fileIds, status } = ctx.request.body;
        if (!Array.isArray(fileIds) || fileIds.length === 0) throw new Error("无效的文件ID列表");
        // 状态 0 永久删除 1 移动到回收站 
        // FileTable表的status 0 = 正常  // 1 = 回收站  // 2 = 移动/重命名处理中 // 3 = 父级删除但子目录需隐藏
        // 删除永久父节点时 如果子节点有文件在回收站就吧 父节点状态设置为 3 并且重命名为 .+ Date.now() + filename
        const files = await FileTable.find([{ field: "id", value: fileIds, op: "in" }], { pageSize: -1 });
        if (status == 0) {
            for (const file of files) {
                if (!file) continue;
                const recycleFiles = await getFileList([{ field: "ancestor_id", value: file.id }, { field: "depth", value: 0, op: ">" }, { field: "status", value: 1 }]);
                let whiteIds = [];
                if (recycleFiles.length) {
                    whiteIds = await parentToRecycle(file.id, recycleFiles.sort((a, b) => b.depth - a.depth));
                }
                const removefiles = await getFileList([{ field: "ancestor_id", value: file.id }, { field: "depth", value: 0, op: ">" }, { field: "t2.id", value: whiteIds, op: "not in" }]);
                console.log(removefiles);
            }
            ctx.success("文件已永久删除");
        } else {
            await FileTable.updateMany([{ field: "id", value: fileIds, op: "in" }, { field: "status", value: 0 }], { status: 1 });
            ctx.success("文件已入回收站");
        }
    } catch (error) {
        ctx.fail(error.message);
    }

}

async function parentToRecycle(parentId, files) {
    const whiteIds = new Set();
    for (const file of files) {
        const chain = await getFileList([{ field: "ancestor_id", value: parentId }, { field: "depth", value: 0, op: ">" }, { field: "depth", value: file.depth, op: "<" }]);
        chain.sort((a, b) => b.depth - a.depth);
        let currentId = file.parentId;
        for (const f of chain) {
            if (f.id == currentId) {
                whiteIds.add(f.id);
                currentId = f.parentId;
            }
        }
        if (file.isFolder == 1) {
            const children = await getFileList([{ field: "ancestor_id", value: file.id }, { field: "depth", value: 0, op: ">" }]);
            whiteIds.add(...children.map(f => f.id));
        }
        whiteIds.add(file.id)
    }
    return Array.from(whiteIds);
}