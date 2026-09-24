import { odm, BaseSchema } from "@/database/index.js"
const { DataType } = await import("mysql-dsl/schema");


const logSchema = new BaseSchema({
    // 1. 操作主体信息（谁干的）
    userId: { type: DataType.BigInt, nullable: true },         // 操作人 ID（未登录/系统触发可为空）
    username: { type: DataType.VarChar, length: 100 },         // 操作人账号/姓名（冗余保存，防止用户被删后日志失效）
    nickname: { type: DataType.VarChar, length: 100 },         // 操作人昵称（冗余保存，防止用户被删后日志失效）
    roleName: { type: DataType.VarChar, length: 100 },         // 操作时的角色/部门名称

    // 2. 行为与业务上下文（干了什么）
    action: { type: DataType.VarChar, length: 100 },           // 操作动作/描述（如：修改用户密码、删除商品、导出列表）
    logType: { type: DataType.VarChar, length: 255 }, // 日志类型：OPERATION(操作), LOGIN(登录), SYSTEM(报错/系统)
    // 3. 网络与请求环境（在哪干的）
    method: { type: DataType.VarChar, length: 10 },            // HTTP 方法：GET, POST, PUT, DELETE
    requestUrl: { type: DataType.VarChar, length: 255 },                      // 请求的完整 URL / 路由 path
    ip: { type: DataType.VarChar, length: 45 },                // 客户端 IP 地址（支持 IPv6）
    userAgent: { type: DataType.VarChar, length: 255 },                       // 浏览器/客户端环境标示
    // 4. 数据与报错详情（细节现场）
    reqParams: { type: DataType.Text },                       // 请求参数（Body / Query / Params，建议脱敏后存为 JSON）
    resBody: { type: DataType.LongText },                         // 响应结果（接口返回的 JSON，可选存储）
    status: { type: DataType.Int },                        // HTTP 状态码或业务状态码（200, 400, 500 等）
    executionTime: { type: DataType.Int },                 // 接口执行耗时（毫秒 ms，用于性能监控）
    errorMessage: { type: DataType.VarChar, length: 255 },                    // 异常堆栈 / 错误摘要（仅在报错时记录）

});
const systemLoggerModel = await odm.model('system_logger', logSchema); 
export default systemLoggerModel;  