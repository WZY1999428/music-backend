const moment = require('moment');

Object.defineProperty(String.prototype, 'isEmpty', {
  value: function() { return this.length === 0; },
  enumerable: false
});

Object.defineProperty(Array.prototype, 'isEmpty', {
  value: function() { return this.length === 0; },
  enumerable: false
});

Object.defineProperty(Object.prototype, 'isEmpty', {
  value: function() {
    return Object.keys(this).length === 0;
  },
  enumerable: false
});


// 给 Date 扩展一个 format 方法
Object.defineProperty(Date.prototype, 'format', {
  value: function(fmt = 'YYYY-MM-DD HH:mm:ss') {
    return moment(this).format(fmt);
  },
  enumerable: false // 不会被 for..in 枚举
});


//  Array.prototype.isEmpty = function () { return this.length === 0; } 可能导致逻辑错误，尤其是你的代码里有用 for..in 遍历对象或数组的时候。
// const arr = [1, 2, 3];
// for (let key in arr) {   console.log(key);}
// 输出：
// 0
// 1
// 2
// isEmpty
// 你本来只想遍历数组索引 0,1,2
// 现在 isEmpty 也被遍历到了
// 如果你在循环里用 arr[key]，arr['isEmpty'] 就是函数，可能破坏逻辑
// 2️⃣ 对 Object 更严重
// Object.prototype.isEmpty = function () { return Object.keys(this).length === 0; }
// const obj = {a: 1, b: 2};
// for (let key in obj) {
//   console.log(key);
// }
// 输出：
// a
// b
// isEmpty
// 很多后端/库函数用 for..in 遍历对象属性
// 加了原型扩展后，isEmpty 会被当作普通属性处理
// 可能导致：
// 数据被误处理
// JSON.stringify 出现异常（如果循环操作对象构造的新的对象）
// 第三方库报错或逻辑异常