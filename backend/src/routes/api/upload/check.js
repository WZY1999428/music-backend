// 获取回收站中的所有项目列表。
const { FileTable } = require("@/modules/sqlite/model");
module.exports = async (ctx) => {
    const { hash } = ctx.query;
    console.log(hash);
    ctx.success("111111")
};