// 解析查询 为 SQL
const { QueryComparison, Logical, Evaluation, } = require("../operators");

module.exports = (query) => {
    const params = [];
    const parse = (obj) => {
        const clauses = [];
        for (const key in obj) {
            const value = obj[key];
            // ===== 逻辑操作 =====
            if (Logical[key]) {
                if (key === "$and" || key === "$or") {
                    if (!Array.isArray(value)) {
                        throw new Error(`${key} value must be an array`);
                    }
                    const parts = value.map(v => `(${parse(v)})`);
                    clauses.push(parts.join(` ${Logical[key]} `));
                }
                if (key === "$not") {
                    clauses.push(`NOT (${parse(value)})`);
                }
                if (key === "$nor") {
                    if (!Array.isArray(value)) {
                        throw new Error(`$nor value must be an array`);
                    }
                    const parts = value.map(v => `(${parse(v)})`);
                    clauses.push(`NOT (${parts.join(" OR ")})`);
                }
                continue;
            }
            // ===== 字段查询 =====
            // 简写： {name:"tom"}
            if (typeof value !== "object" || value === null || Array.isArray(value)) {
                clauses.push(`${key} = ?`);
                params.push(value);
                continue;
            }

            // ===== 多操作符处理 =====
            for (const op in value) {
                const val = value[op];
                // ---------- 比较 ----------
                if (QueryComparison[op]) {
                    const operator = QueryComparison[op];
                    if (op === "$in" || op === "$nin") {
                        const placeholders = val.map(() => "?").join(",");
                        clauses.push(`${key} ${operator} (${placeholders})`);
                        params.push(...val);
                    }
                    else {
                        clauses.push(`${key} ${operator} ?`);
                        params.push(val);
                    }
                    continue;
                }
                if (Evaluation[op]) {
                    if (op === "$exists") {
                        clauses.push(`${key} ${val ? "IS NOT NULL" : "IS NULL"}`);
                    } else {
                        let pattern = val;
                        switch (op) {
                            case "$like": pattern = `%${val}%`; break;
                            case "$lLike": pattern = `${val}%`; break;
                            case "$rLike": pattern = `%${val}`; break;
                            case "$nLike": pattern = `%${val}%`; break;
                            case "$nlLike": pattern = `${val}%`; break;
                            case "$nrLike": pattern = `%${val}`; break;
                        }
                        clauses.push(`${key} ${Evaluation[op]} ?`);
                        params.push(pattern);
                    }
                    continue;
                }
            }
        }
        return clauses.join(" AND ");
    };
    const sql = parse(query);
    return { sql: sql ? `WHERE ${sql}` : "", params };
};