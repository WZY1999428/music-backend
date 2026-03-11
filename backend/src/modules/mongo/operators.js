/**
 * 查询比较操作符 (Query Comparison)
 * 用于处理字段与值之间的比较逻辑
 */
const QueryComparison = {
    $eq: "=",          // 等于：field = value
    $ne: "!=",         // 不等于：field != value
    $gt: ">",          // 大于：field > value
    $gte: ">=",        // 大于等于：field >= value
    $lt: "<",          // 小于：field < value
    $lte: "<=",        // 小于等于：field <= value
    $in: "IN",         // 包含在集合内：field IN (v1, v2, ...)
    $nin: "NOT IN"     // 不在集合内：field NOT IN (v1, v2, ...)
};

/**
 * 逻辑操作符 (Logical)
 * 用于连接多个查询条件，通常涉及递归解析
 */
const Logical = {
    $and: "AND",       // 逻辑与：(cond1 AND cond2)
    $or: "OR",         // 逻辑或：(cond1 OR cond2)
    // 注意：$not 和 $nor 在 SQL 中通常需要配合括号和前置 NOT 关键字
    $not: "NOT",       // 逻辑非：NOT (condition)
    $nor: "NOR"        // 逻辑异或（全否）：NOT (cond1 OR cond2)
};

/**
 * 评估/特殊操作符 (Evaluation)
 * 处理模糊查询、空值判断等高级逻辑
 */
const Evaluation = {
    // $exists 在 SQL 中通常表现为字段是否为 NULL
    $exists: "IS NOT NULL",
    $notExists: "IS NULL",
    // MongoDB 原生使用 $regex，这里扩展 SQL 常用的模糊匹配
    $like: "LIKE",          // 模糊匹配：field LIKE '%value%'
    $lLike: "LIKE",          // 模糊匹配：field LIKE 'value%'
    $rLike: "LIKE",          // 模糊匹配：field LIKE '%value'
    $nLike: "NOT LIKE",      // 不匹配：field NOT LIKE '%value%'
    $nlLike: "NOT LIKE",      // 不匹配：field NOT LIKE 'value%'
    $nrLike: "NOT LIKE"      // 不匹配：field NOT LIKE '%value'
};


// 排序
const SortOrder = {
    asc: "ASC",
    desc: "DESC"
};

module.exports = {
    QueryComparison,
    Logical,
    Evaluation,
    SortOrder
};