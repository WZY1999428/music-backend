declare global {
    /**
     * 验证值是否有效
     *
     * 判断值是否不是 null、undefined 或空字符串。
     */
    function $validate(
        value: string | number | boolean | null | undefined
    ): boolean;
    /**
     * 判断两个值是否不相等
     * @param value 
     * @param target 
     */
    function $validateNeq(
        value: any,
        target: any
    ): boolean;

    /**
     * 判断两个值是否相等
     * @param value 
     * @param target 
     */
    function $validateEq(
        value: any,
        target: any
    ): boolean;


    /**
     * 验证邮箱格式
     */
    function $validateEmail(
        value: string
    ): boolean;


    /**
     * 验证中国大陆手机号码格式
     */
    function $validatePhone(
        value: string
    ): boolean;


    /**
     * 验证数组是否为非空数组
     */
    function $validateArray<T>(
        value: unknown
    ): value is T[];


    /**
     * 验证中国大陆居民身份证号码格式
     */
    function $validateIdCard(
        value: string
    ): boolean;
}

export { };