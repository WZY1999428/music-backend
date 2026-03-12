const { FileTable } = require('@/modules/mongo/model')
const { buildFileRecord, createClosurePaths, isValidFileName } = require("@/modules/fileSystem/utils");
const fs = require('fs-extra')
const path = require('path')
module.exports = async (ctx) => {
    let newPath = "";
    try {
        const { parentId, name } = ctx.request.body
        if (name == "") throw new Error('文件名不能为空');
        if (!isValidFileName(name)) throw new Error('文件名不合法');
        const files = await FileTable.find({ parentId })
        if (files.some(f => f.name == name)) throw new Error('文件名已存在');
        let parent = await FileTable.findOne({ id: parentId })
        if (!parent) parent = { rootPath: process.env.PUBLIC_FILE_PATCH, path: "" }
        newPath = path.join(parent.rootPath, parent.path, name)
        await fs.mkdir(newPath)
        const record = await buildFileRecord(newPath, parentId)
        const result = await FileTable.insert(record)
        await createClosurePaths(result.id, parentId)
        ctx.success(null, "创建文件夹成功")
    } catch (error) {
        if (newPath) await fs.remove(newPath)
        ctx.fail(error.message)
    }
}

