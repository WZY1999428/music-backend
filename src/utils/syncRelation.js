/**
 * 同步关联数据
 *
 * 数据库存在 + 新数据存在：忽略
 * 数据库不存在 + 新数据存在：插入
 * 数据库存在 + 新数据不存在：删除
 *
 * @param {Object} options
 * @param {Object} options.model 关联模型
 * @param {Object} options.where 查询条件
 * @param {Array} options.list 前端传入的数据
 * @param {string} options.key 用于判断数据是否存在的字段
 * @param {Function} options.createInsertData 生成插入数据
 */
export async function syncRelation({
    model,
    oldList = [],
    list = [],
    key,
    createInsertData
}) {

    const oldMap = new Map(
        oldList.map(item => [item[key], item])
    )

    const newSet = new Set(
        list.map(item => {
            return typeof item === 'object'
                ? item[key]
                : item
        })
    )

    // 不存在的插入
    const insertList = list
        .filter(item => {
            const value = typeof item === 'object'
                ? item[key]
                : item

            return !oldMap.has(value)
        })
        .map(item => createInsertData(item))

    // 新数据已经删除的关系
    const deleteList = oldList.filter(
        item => !newSet.has(item[key])
    )
    await Promise.all([
        insertList.length
            ? model.insertMany(insertList)
            : null,
        deleteList.length
            ? model.deleteMany({ id: { $in: deleteList.map(item => item.id) } })
            : null,
    ])
}