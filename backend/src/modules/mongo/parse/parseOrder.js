// 根据 order 对象生成 ORDER BY 语句


module.exports = (order) => {
    const orderKeys = Object.keys(order);
    let orderSql = "";

    if (orderKeys.length > 0) {
        const orderParts = orderKeys.map(key => `${key} ${(order[key] || 'asc').toUpperCase()}`);
        orderSql = `ORDER BY ${orderParts.join(", ")}`;
    }
    return orderSql;
};