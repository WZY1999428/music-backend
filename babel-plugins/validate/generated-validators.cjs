/**
 * 验证值是否有效
 *
 * 判断值是否不是 null、undefined 或空字符串。
 *
 * @param {string | number | boolean | null | undefined} value 待验证的值
 * @returns {boolean} 是否为有效值
 */
exports.validate = function (value) {
    return (value === null || value === undefined || value === '') === false;
};


/**
 * 验证邮箱格式
 *
 * 校验是否符合常见邮箱格式。
 *
 * @param {string} value 邮箱地址
 * @returns {boolean} 是否为合法邮箱格式
 */
exports.validateEmail = function (value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};


/**
 * 验证中国大陆手机号码格式
 *
 * 格式要求：
 * - 11位数字
 * - 第一位为 1
 * - 第二位为 3-9
 *
 * @param {string} value 手机号码
 * @returns {boolean} 是否为合法手机号
 */
exports.validatePhone = function (value) {
    return /^1[3-9]\d{9}$/.test(value);
};


/**
 * 验证数组是否为非空数组
 *
 * 判断值是否为数组，并且数组长度大于 0。
 *
 * @template T
 * @param {T[]} value 待验证的数组
 * @returns {boolean} 是否为非空数组
 */
exports.validateArray = function (value) {
    return Array.isArray(value) && value.length > 0;
};


/**
 * 验证中国大陆居民身份证号码格式
 *
 * 格式要求：
 * - 18位身份证号码
 * - 最后一位支持数字或 X/x
 *
 * @param {string} value 身份证号码
 * @returns {boolean} 是否为合法身份证格式
 */
exports.validateIdCard = function (value) {
    return /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])\d{2}[0-9Xx]$/.test(value);
};