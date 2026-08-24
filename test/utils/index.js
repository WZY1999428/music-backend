// =========================
// 1. 基础变量
// =========================

// export const numberValue = 123;

// export const stringValue = "hello";

// export const booleanValue = true;

// export const nullValue = null;


// =========================
// 2. 数组 / 对象
// =========================

// export const arr = [1, 2, 3, 4];

// export const obj = {
//     a: 1,
//     b: 2
// };


// =========================
// 3. 函数
// =========================

// export function normalFunction() {
//     return 1;
// }

// export const arrowFunction = () => {
//     return 1;
// };

// export const arrowFunctionShort = () => 123;

// export const functionExpression = function () {
//     return 123;
// };


// =========================
// 4. Class
// =========================

// export class User {
//     constructor() {}
// }

// export const User2 = class {
//     constructor() {}
// };

// export const User3 = class User3 {
//     constructor() {}
// };


// =========================
// 5. 正则 / Symbol / BigInt
// =========================

// export const regex = /abc/g;

// export const symbol = Symbol("test");

// export const bigInt = 123n;


// =========================
// 6. 已经声明，再 export
// =========================

const normalObject = {
    a: 1
};

export { normalObject };


// const normalArray = [1, 2, 3];

// export { normalArray };


// function testFunction() {}

// export { testFunction };


// class TestClass {}

// export { TestClass };


// =========================
// 7. export 重命名
// =========================

// const foo = 123;

// export {
//     foo as renamedFoo
// };


// =========================
// 8. default + 命名
// =========================

// export default function defaultFunction() {}

// export const xxx = 123;


// =========================
// 11. 命名 default class
// =========================

// export default class DefaultUser {
//     constructor() {}
// }


// =========================
// 17. export 多个
// =========================

// const a = 1;
// const b = 2;
// const c = 3;

// export {
//     a,
//     b,
//     c
// };


// =========================
// 18. export 重命名
// =========================

// const aaa = 1;

// export {
//     aaa as bbb
// };


// =========================
// 19. export * 
// =========================

// export * from "./other.js";


// =========================
// 20. export * as
// =========================

// export * as utils from "./utils.js";


// =========================
// 21. re-export
// =========================

// export { foo } from "./foo.js";

// export { bar as baz } from "./bar.js";


// =========================
// 22. default re-export
// =========================

// export { default as User } from "./User.js";


// =========================
// 23. 多种声明混合
// =========================

// export const mixedNumber = 123;

// export function mixedFunction() {}

// export class MixedClass {}


// =========================
// 24. 条件表达式
// =========================

// const condition = true;

// export const conditional = condition
//     ? foo
//     : bar;


// =========================
// 25. 调用表达式
// =========================

// export const result = createSomething();


// =========================
// 26. 成员表达式
// =========================

// const config = {
//     user: {
//         name: "test"
//     }
// };

// export const userName = config.user.name;


// =========================
// 27. 解构
// =========================

// const data = {
//     name: "test",
//     age: 18
// };

// const {
//     name,
//     age
// } = data;

// export {
//     name,
//     age
// };


