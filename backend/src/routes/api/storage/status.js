// 获取总容量、已用容量、剩余容量等数据。

const { User } = require('@/modules/sqlite/model')
module.exports = async (ctx) => {
    ctx.success(await User.findOne({}))
}