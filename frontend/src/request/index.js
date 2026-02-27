import axios from "axios";
import { ElMessage } from "element-plus";
import router from "@/router";

const request = axios.create({
    baseURL: "/api/",
    timeout: 1000 * 60
});

// 请求拦截
request.interceptors.request.use(config => {
    const token = localStorage.getItem('token'); // 假设你存在这里
    if (token) config.headers.authorization = `Bearer ${token}`;
    return config;
}, error => Promise.reject(error));

// 响应拦截
request.interceptors.response.use(res => {
    const data = res.data;
    // 这里的判断逻辑保持你的原样
    if (data.code !== 0 && res.headers['content-type'] !== "application/octet-stream") {
        ElMessage.error(data.msg);
        return Promise.reject(data);
    }
    return data;
}, error => {
    // 1. 处理取消请求的情况
    if (error.code === 'ERR_CANCELED') {
        return Promise.reject({ __CANCELED__: true });
    }
    // 2. 原有的 401 处理
    const responseURL = error.request?.responseURL;
    if (responseURL) {
        const skipLoginPrompt = /^\/api\/files\/\d+$/.test(new URL(responseURL).pathname);
        if (error.response?.status === 401 && !skipLoginPrompt) {
            ElMessage.error("登录已过期，请重新登录");
            clearStorage();
            router.replace('/login');
        }
    }

    return Promise.reject(error);
});
//  包装自动取消上一次请求
export const createRequestWrapper = (configFactory, { autoCancel = true } = {}) => {
    let controller = null;
    return (params) => {
        if (autoCancel && controller) {
            controller.abort(); // 取消上一个
        }
        controller = new AbortController();
        const config = configFactory(params);
        return request({
            ...config,
            signal: controller.signal
        }).finally(() => {
            controller = null;
            // 注意：只有当请求是因为完成而结束时才置空
            // 如果是因为下一次请求开始而 abort，不需要在这里干预
        });
    };
};

export const createCancelableRequest = (configFactory) => {
    return (params) => {
        const controller = new AbortController();
        const config = configFactory(params);
        const promise = request({
            ...config,
            signal: controller.signal
        })
        return {
            request: promise,
            cancel: () => controller.abort()
        };
    };
};

export default createRequestWrapper;