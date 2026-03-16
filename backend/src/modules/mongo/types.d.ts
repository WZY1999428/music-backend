// types.d.ts

/** 查询操作符 */
interface QueryOperators {
    $eq?: any;
    $ne?: any;
    $gt?: any;
    $gte?: any;
    $lt?: any;
    $lte?: any;
    $in?: any[];
    $nin?: any[];
    $like?: string;
    /** 聚合子查询：{ table: string, childWhere?: Filters } */
    $max?: boolean | { table: string, childWhere?: any };
    $min?: boolean | { table: string, childWhere?: any };
}

/** 过滤条件结构 */
interface Filters {
    $and?: Filters[];
    $or?: Filters[];
    $not?: Filters;
    // 允许任意字符串键指向值或操作符对象
    [key: string]: any | QueryOperators;
}

/** 统一的查询参数对象 */
interface QueryOptions {
    filters?: Filters;
    fields?: string[];
    limit?: number;
    offset?: number;
}