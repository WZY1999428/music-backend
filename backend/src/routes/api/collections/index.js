const { Collection } = require("@/modules/sqlite/model");
module.exports = async (ctx) => ctx.success(await Collection.find({}));