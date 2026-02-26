// 获取回收站中的所有项目列表。
const { FileTable } = require("@/modules/sqlite/model");
const { generateFileToken } = require("@/modules/tokens")
module.exports = async (ctx) => {
    const data = await FileTable.find([{ field: "status", value: 1 }], { pageSize: -1 });
    ctx.success(data.map(f => ({ ...f, access_token: generateFileToken(f.fileId, ctx.state.user.userId) })));
};