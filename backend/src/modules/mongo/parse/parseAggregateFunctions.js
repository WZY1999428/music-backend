const { AggregateFunctions } = require("../operators");
module.exports = (aggs) => {
    let fields = [];
    let groupBy = "";
    for (const key in aggs) {
        if (key === "groupBy") {
            groupBy = ` GROUP BY ${aggs[key].join(", ")}`;
            continue;
        }
        const value = aggs[key];
        const op = Object.keys(value)[0];
        const field = value[op];
        if (AggregateFunctions[op]) {
            fields.push(`${AggregateFunctions[op]}(${field}) AS ${key}`);
        }
    }
    return {
        select: fields.join(", "),
        groupBy
    };
}