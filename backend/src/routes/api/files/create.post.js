const { FileTable } = require('@/modules/sqlite/model')
const { buildFileRecord, isValidFileName } = require("@/modules/fileSystem/utils");
const fs = require('fs-extra')
const path = require('path')
module.exports = async (ctx) => {
    let newPath = "";
    try {
        const { parentId, name } = ctx.request.body
        if (name == "") throw new Error('文件名不能为空');
        if (!isValidFileName(name)) throw new Error('文件名不合法');
        const sqlField = [{ field: 'parentId', value: parentId }]
        const files = await FileTable.find(sqlField)
        if (files.some(f => f.name == name)) throw new Error('文件名已存在');
        let parent = await FileTable.findOne([{ field: 'id', value: parentId }])
        if (!parent) {
            parent = {
                rootPath: process.env.PUBLIC_FILE_PATCH,
                path: ""
            }
        }
        newPath = path.join(parent.rootPath, parent.path, name)
        await fs.mkdir(newPath)
        const record = await buildFileRecord(newPath, parentId)
        await FileTable.insert(record)
        ctx.success(null, "创建文件夹成功")
    } catch (error) {
        if (newPath) await fs.remove(newPath)
        ctx.fail(error.message)
    }
}

