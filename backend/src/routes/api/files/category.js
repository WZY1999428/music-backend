const { FileTable } = require("@/modules/sqlite/model")
module.exports = async (ctx) => {
    try {
        const { parentId = 0, category = '', keyword = '' } = ctx.query
        if (!category) throw new Error('category is required')
        const filters = [
            { "field": "status", "value": 0 },
            { "field": "category", "value": category },
        ]
        if (parentId != 0) filters.unshift({ "field": "parentId", "value": parentId },)
        if (keyword) filters.push({ "field": "name", "value": `%${keyword}%`, "op": "LIKE" })
        let files = await FileTable.find(filters, { "pageSize": -1, "fields": ["id", "name", "path", "isFolder", "parentId", 'category', "size", "mimeType", "extension", "createdAt", "updatedAt"] })
        const fileMap = new Set();
        let dirs = [];
        if (parentId == 0) {
            files = files.filter(file => {
                if (file.parentId) {
                    fileMap.add(file.parentId);
                    return false;
                }
                return true;
            });
            const ids = Array.from(fileMap.keys());
            if (ids.length) {
                dirs = await FileTable.find([
                    { "field": "id", "value": ids, "op": "IN" }
                ], { "fields": ["id", "name", "path", "isFolder", "parentId", 'category', "size", "mimeType", "extension", "createdAt", "updatedAt"] })
            }
        }
        ctx.success([...dirs, ...files])
    } catch (error) {
        ctx.fail(error.message)
    }
}