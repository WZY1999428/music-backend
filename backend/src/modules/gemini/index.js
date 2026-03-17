import { GoogleGenAI } from "@google/genai";


class Gemini {
    ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_APP_KEY,
        httpOptions: {
            baseUrl: "https://hkta.cc:8080/"
        }
    });
    constructor() {
        if (Gemini.instance) {
            return Gemini.instance;
        }
        // 初始化操作
        this.name = "Cloud Agent Gemini";
        Gemini.instance = this;
    }

    static getInstance() {
        if (!Gemini.instance) {
            Gemini.instance = new Gemini();
        }
        return Gemini.instance;
    }

    sendRequest(data) {
        console.log("Sending data to cloud:", data);
        // 这里可以写网络请求逻辑
    }
}

const g1 = Gemini.getInstance();