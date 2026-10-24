import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';


function add(a, b) {
    return a + b;
}


async function main() {
    // 1. 声明 AI 可以调用的函数
    const addDeclaration = {
        name: "add",
        description: "计算两个数字的和",
        parametersJsonSchema: {
            type: "object",
            properties: {
                a: {
                    type: "number",
                    description: "第一个数字"
                },
                b: {
                    type: "number",
                    description: "第二个数字"
                }
            },
            required: ["a", "b"]
        }
    };

    const ai = new GoogleGenAI({
        apiKey: "AIzaSyDjMJM_u4Da0CavL-WW-hHwmbp7i36WYZc",
        httpOptions: {
            baseUrl: "https://hkta.cc:8848"
        }
    });

    // 2. 让 AI 决定调用哪个函数，以及传什么参数
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "帮我计算 123 + 456",
        config: {
            tools: [{
                functionDeclarations: [addDeclaration]
            }],
            toolConfig: {
                functionCallingConfig: {
                    mode: FunctionCallingConfigMode.ANY,
                    allowedFunctionNames: ["add"]
                }
            }
        }
    });

    // 3. 取出 AI 请求的函数调用
    const calls = response.functionCalls ?? [];

    for (const call of calls) {
        if (call.name === "add") {
            const { a, b } = call.args;

            // 4. 在你自己的 JavaScript 程序中执行
            const result = add(a, b);

            console.log("函数名称：", call.name);
            console.log("函数参数：", call.args);
            console.log("计算结果：", result);
        }
    }
}

main().catch(console.error);