const { FileTable } = require("@/modules/mongo/model")
module.exports = async (ctx) => {
    try {
        const { parentId = 0, category = '', keyword = '' } = ctx.query
        if (!category) throw new Error('category is required')
        const filters = { status: 0, category }
        if (parentId != 0) filters.parentId = parentId;
        if (keyword) filters.name = { $like: `%${keyword}%` }

        let files = await FileTable.find(filters, { pageSize: -1, fields: ["id", "name", "path", "isFolder", "parentId", 'category', "size", "mimeType", "extension", "createdAt", "updatedAt"] })
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
                dirs = await FileTable.find({ id: { $in: ids } }, { "fields": ["id", "name", "path", "isFolder", "parentId", 'category', "size", "mimeType", "extension", "createdAt", "updatedAt"] })
            }
        }
        ctx.success([...dirs, ...files])
    } catch (error) {
        ctx.fail(error.message)
    }
}