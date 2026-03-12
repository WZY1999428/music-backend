const { FilePathTable } = require("@/modules/mongo/model");
const { generateFileToken } = require("@/modules/tokens")
const { getFileList } = require("@/modules/fileSystem/utils")
module.exports = async (ctx) => {
    try {
        const parentId = ctx.query.parentId || 0;
        const keyword = ctx.query.keyword || '';
        const filters = { "t2.status": 0, "t2.isFolder": 1 }
        if (parentId == 0) {
            if (!keyword) filters["t2.parentId"] = 0;
        } else {
            const parent = await FilePathTable.findOne({ ancestor_id: parentId });
            if (!parent) throw new Error("父级目录不存在");
            filters["ancestor_id"] = parentId;
            filters["depth"] = keyword ? { $gt: 0 } : { $eq: 1 };
        }
        if (keyword) filters["t2.name"] = { $like: `%${keyword}%` }
        
        const files = await getFileList({ filters, fields: ["t2.rootPath"] });
        ctx.success(files.map(f => ({ ...f, access_token: generateFileToken(f.id, ctx.state.user.userId) })));
    } catch (err) {
        ctx.fail("获取列表失败: " + err.message);
    }
};
