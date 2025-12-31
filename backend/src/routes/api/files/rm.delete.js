const { FileTable, Favorite } = require("@/modules/sqlite/model");
const fs = require("fs-extra");
const path = require("path");
const { parseParendIds } = require("@/modules/fileSystem/utils");
module.exports = async (ctx) => {
    const { fileIds, status } = ctx.request.body;
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return ctx.fail("无效的文件ID列表");
    }
    if (status == 0) {
        const files = await FileTable.find([{ field: "id", value: fileIds, op: "in" }], { pageSize: -1 });
        const shellFolderIds = new Set();
        let shellFolderFile = [];
        let finalRmFiles = [];
        let ids = new Set();
        let isCommit = false;
        try {
            for (const file of files) {
                const trashFile = await FileTable.findOne([{ field: "fullPathId", value: `%-${file.id}-%`, op: "like" }, { field: "status", value: 1 }, { field: "id", value: file.id, op: "!=" }]);
                //查询子目录 sql
                const childrenSql = [{ field: "fullPathId", value: `%-${file.id}-%`, op: "like" }];
                // 如果回收站有这个目录的文件 把回收站里的文件所有的父节点目录排除物理删除
                if (trashFile && file.isFolder === 1) {
                    shellFolderFile.push(file)
                    shellFolderIds.add(file.id)
                    const parendIds = parseParendIds(file.fullPathId);
                    parendIds.splice(0, parendIds.indexOf(file.id));
                    childrenSql.push({ field: "status", value: 0 }, { field: "id", value: parendIds, op: "not in" });
                } else ids.add(file.id)
                if (file.isFolder == 1) {
                    (await FileTable.find(childrenSql, { pageSize: -1 })).forEach(c => ids.add(c.id));
                }
            }
            await FileTable.beginTransaction();
            isCommit = false;
            // 把回收站里有文件的目录状态改为3 并且重新命名
            if (shellFolderIds.size > 0) {
                shellFolderFile.sort((a, b) => b.path.length - a.path.length);
                await rename(shellFolderFile)
                await FileTable.updateMany([{ field: "id", value: Array.from(shellFolderIds), op: "in" }, { field: "isFolder", value: 1 }], { status: 3 });
            }
            if (ids.size > 0) {
                ids = Array.from(ids)
                finalRmFiles = await FileTable.find([{ field: "id", value: ids, op: "in" }], { pageSize: -1 });
                await FileTable.deleteMany([{ field: "id", value: ids, op: "in" }]);
                await Favorite.deleteMany([{ field: "fileId", value: ids, op: "in" }]);
            }
            await FileTable.commit();
            isCommit = true;
        } catch (dbErr) {
            if (!isCommit) await FileTable.rollback().catch({})
            throw dbErr; // 数据库失败，直接跳出，不删物理文件  
        }
        // 先删除文件在删除目录 
        const failed = [];
        await removeFile(finalRmFiles, failed);
        return ctx.success(`删除完成${failed.length ? `，物理清理失败 ${failed.length}个, 失败记录写入orphaned.json中` : ""}`);
    } else {
        try {
            await FileTable.beginTransaction();
            await rename(await FileTable.find([{ field: "id", value: fileIds, op: "in" }], { pageSize: -1 }));
            await FileTable.commit();
            ctx.success("文件已入回收站");
        } catch (error) {
            await FileTable.rollback().catch({})
            ctx.fail(error.message);
        }
    }
}


async function rename(files) {
    for (const file of files) {
        const name = `.${Date.now()}-${file.name}`;
        const newPath = path.join(file.path, `../${name}`);
        const index = parseParendIds(file.fullPathId).indexOf(file.id);
        if (file.isFolder == 1 && index > -1) {
            const children = await FileTable.find([{ field: "fullPathId", value: `%-${file.id}-%`, op: "LIKE" }, { field: "id", value: file.id, op: "!=" }], { pageSize: -1 });
            for (const cFile of children) {
                const pathArr = cFile.path.split(path.sep).filter(Boolean);
                pathArr.splice(index, 1, name);
                await FileTable.update({ id: cFile.id }, { path: path.join(...pathArr) });
            }
        }
        await FileTable.updateMany([{ field: "id", value: file.id }, { field: "status", value: 3, op: "!=" }], { status: 1, path: newPath });
        await fs.move(path.join(file.rootPath, file.path), path.join(file.rootPath, newPath));
    }
}


async function removeFile(finalRmFiles, failed) {
    finalRmFiles.sort((a, b) => b.path.length - a.path.length);
    for (const file of finalRmFiles) {
        try {
            await fs.remove(path.join(file.rootPath, file.path));
        } catch (err) {
            const code = err.code;
            // 文件不存在，不用管 
            console.log(err);
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