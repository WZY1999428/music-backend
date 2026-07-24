/**
 * 将指定的整数字段（1/0）转换为布尔值（true/false）
 * @param {Object|Array} data - 要转换的数据对象或对象数组
 * @param {string[]} [keys=[]] - 需要从整数转换为布尔值的字段名数组
 * @returns {Object|Array} 转换后的原始数据
 * @example
 * convertIntFieldsToBoolean({ isActive: 1, name: 'John' }, ['isActive'])
 * // 返回 { isActive: true, name: 'John' }
 */
export function convertIntFieldsToBoolean(data, keys = []) {
    if (!data) return data;

    const normalize = item => {
        keys.forEach(key => {
            item[key] = item[key] === 1;
        });
    };

    (Array.isArray(data) ? data : [data]).forEach(normalize);

    return data;
}

/**
 * 将指定的布尔字段（true/false）转换为整数值（1/0）
 * @param {Object|Array} data - 要转换的数据对象或对象数组
 * @param {string[]} [keys=[]] - 需要从布尔值转换为整数的字段名数组
 * @returns {Object|Array} 转换后的原始数据
 * @example
 * convertBooleanFieldsToInt({ isActive: true, name: 'John' }, ['isActive'])
 * // 返回 { isActive: 1, name: 'John' }
 */
export function convertBooleanFieldsToInt(data, keys = []) {
    if (!data) return data;

    const normalize = item => {
        keys.forEach(key => {
            item[key] = item[key] === true ? 1 : 0;
        });
    };

    (Array.isArray(data) ? data : [data]).forEach(normalize);

    return data;
}


