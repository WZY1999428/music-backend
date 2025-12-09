// 获取回收站中的所有项目列表。
const { FileTable } = require("@/modules/sqlite/model");
module.exports = async (ctx) => ctx.success(await FileTable.find([{ field: "status", value: 1 }]));