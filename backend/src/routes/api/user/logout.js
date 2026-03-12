const { Token } = require("@/modules/mongo/model")
module.exports = async (ctx) => {
    const token = ctx.headers['authorization']?.split(' ')[1];
    try {
        await Token.deleteOne({ token })
        ctx.success("退出成功")
    } catch (error) {
        ctx.fail("退出失败:" + error.message)
    }
}