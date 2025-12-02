const { FileTable } = require("../../../modules/sqlite/model");
module.exports = async (ctx) => {
    const query = ctx.query;
    console.log()
    FileTable.find([]).then((fileList) => {
        console.log(fileList)
    })

    ctx.success([]);
};

