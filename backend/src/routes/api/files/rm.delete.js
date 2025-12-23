const { FileTable, Favorite } = require("@/modules/sqlite/model");
const fs = require("fs-extra");
const path = require("path");
module.exports = async (ctx) => {
    const { fileIds, status } = ctx.request.body;
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return ctx.fail("无效的文件ID列表");
    }
    if (status == 0) {
        const filters = []
        fileIds.forEach(id => filters.push(...[{ field: "fullPathId", value: `%-${id}-%`, op: "Like", logic: "OR" }, { field: "fullPathId", value: `%-${id}`, op: "Like", logic: "OR" }]));
        const files = await FileTable.find(filters, { pageSize: -1 });
        await FileTable.beginTransaction();
        const shellFolderIds = new Set();
        let finalRmFiles = [];
        let shellFolderFile = [];
        try {
            const trash = files.filter(item => item.status == 1);
            const otherFiles = files.filter(item => item.status == 0);
            const ids = new Set();
            for (const file of otherFiles) {
                const token = `-${file.id}-`;
                const trashFile = trash.find(item => item.fullPathId.includes(token));
                if (trashFile && file.isFolder === 1) {
                    const trashFullPathId = trashFile.fullPathId.split("-").filter(Boolean).slice(0, -1).map(Number);
                    const index = trashFullPathId.indexOf(file.id);
                    trashFullPathId.splice(0, index);
                    trashFullPathId.forEach(id => shellFolderIds.add(id));
                    shellFolderFile.push(file);
                } else {
                    finalRmFiles.push(file);
                    ids.add(file.id)
                }
            }
            if (shellFolderIds.size > 0) {
                await FileTable.updateMany([{ field: "id", value: Array.from(shellFolderIds), op: "in" }, { field: "isFolder", value: 1 }], { status: 3 });
                shellFolderFile.sort((a, b) => b.path.length - a.path.length);
                rename(shellFolderFile)
            }
            if (ids.size > 0) {
                await FileTable.deleteMany([{ field: "id", value: Array.from(ids), op: "in" }]);
                await Favorite.deleteMany([{ field: "fileId", value: Array.from(ids), op: "in" }]);
            }
            // 提交事务：此时数据库记录已清理完毕
            await FileTable.commit();
        } catch (dbErr) {
            await FileTable.rollback();
            throw dbErr; // 数据库失败，直接跳出，不删物理文件
        }
        // 先删除文件在删除目录
        finalRmFiles.sort((a, b) => b.path.length - a.path.length);
        const failed = [];
        for (const file of finalRmFiles) {
            try {
                await fs.remove(path.join(file.rootPath, file.path));
            } catch (err) {
                const code = err.code;
                // 文件不存在，不用管
                if (code === 'ENOENT') continue;
                // 中文描述
                let reason = '';
                switch (code) {
                    case 'EACCES':
                    case 'EPERM':
                        reason = '权限不足，无法删除';
                        break;
                    case 'EBUSY':
                        reason = '文件被占用';
                        break;
                    default:
                        reason = '未知错误';
                }

                failed.push({ id: file.id, fullPath: path.join(file.rootPath, file.path), code, reason });
            }
        }
        writeErrors(failed);
        return ctx.success(`删除完成${failed.length ? `，物理清理失败 ${failed.length}个, 失败记录写入orphaned.json中` : ""}`);
    } else {
        try {
            FileTable.beginTransaction();
            await FileTable.updateMany([{ field: "id", value: fileIds, op: "in" }], { status: 1 });
            await Favorite.deleteMany([{ field: "fileId", value: fileIds, op: "in" }])
            FileTable.commit();
            rename(await FileTable.find([{ field: "id", value: fileIds, op: "in" }], { pageSize: -1 })).catch(() => { });
            ctx.success("文件已入回收站");
        } catch (error) {
            FileTable.rollback();
            ctx.fail(error.message);
        }
    }

}


async function rename(files) {
    for (const file of files) {
        const name = `.${Date.now()}-${file.name}`;
        const newPath = path.join(file.path, `../${name}`);
        await fs.move(path.join(file.rootPath, file.path), path.join(file.rootPath, newPath));
        await FileTable.updateMany([{ field: "id", value: file.id }], { path: newPath });
    }
}

const orphanedFilePath = path.join(process.cwd(), "orphaned.json")
async function writeErrors(errors) {
    if (errors.length === 0) return; // 没有错误就不处理
    let existingErrors = [];
    try {
        // 使用 existsSync 检查文件，防止 readFileSync 报错
        if (fs.existsSync(orphanedFilePath)) {
            const content = await fs.readFile(orphanedFilePath, "utf-8");
            existingErrors = JSON.parse(content || "[]");
        }
    } catch (e) {
        console.error("读取 orphaned.json 失败:", e);
    }

    // 使用 Map 去重
    const map = new Map();
    existingErrors.forEach(item => map.set(item.id, item));
    errors.forEach(item => map.set(item.id, item));
    // 写入文件
    try {
        await fs.writeFile(orphanedFilePath, JSON.stringify(Array.from(map.values()), null, 4));
    } catch (e) {
        console.error("写入 orphaned.json 失败:", e);
    }
}

setInterval(async () => {
    const filePath = path.join(process.cwd(), "orphaned.json");
    // 1. 检查文件是否存在
    if (!fs.existsSync(filePath)) return;
    try {
        // 2. 读取并解析
        const content = await fs.readFile(filePath, "utf-8");
        let errors = JSON.parse(content || "[]");
        if (errors.length === 0) return;
        console.log(`[定时任务] 开始清理孤儿文件，共 ${errors.length} 个待处理...`);
        const remainingErrors = [];

        // 3. 循环尝试删除
        for (const error of errors) {
            try {
                // 注意：这里需要根据你存入 JSON 的数据结构来取路径
                // 如果存的是 ID，你可能需要再查一次数据库，但建议在存入时直接存入 fullPath
                if (error.fullPath) {
                    await fs.remove(error.fullPath);
                    console.log(`[定时任务] 成功清理文件: ${error.fullPath}`);
                }
            } catch (err) {
                // 如果还是删不掉（比如依然被占用），保留在队列中
                remainingErrors.push(error);
                console.error(`[定时任务] 清理失败: ${error.fullPath}, 原因: ${err.code}`);
            }
        }

        // 4. 写回结果
        if (remainingErrors.length !== errors.length) {
            await fs.outputJson(filePath, remainingErrors, { spaces: 4 });
            console.log(`[定时任务] 清理完毕，剩余 ${remainingErrors.length} 个记录。`);
        }
    } catch (e) {
        console.error("[定时任务] 执行出错:", e);
    }

}, 1000 * 60 * 60 * 1); // 每 1 小时执行一次