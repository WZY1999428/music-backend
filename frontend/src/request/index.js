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

const showMessageMap = new Set();
// 响应拦截
request.interceptors.response.use(res => {
    const data = res.data;
    if (showMessageMap.has(res.config.url) && data.code !== 0 && res.headers['content-type'] !== "application/octet-stream") {
        if (showMessage) {
            ElMessage.error(data.msg);
        }
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

export const createRequestWrapper = (configFactory, { autoCancel = true, showMessage = true } = {}) => {
    let controller = null;
    return (params) => {
        if (autoCancel && controller) {
            controller.abort(); // 取消上一个
        }
        controller = new AbortController();
        const config = configFactory(params);
        if (showMessage) showMessageMap.add(config.url)
        return request({
            ...config,
            signal: controller.signal
        })
    };
};

export const createCancelableRequest = (configFactory, { showMessage = true } = {}) => {
    return (params) => {
        const controller = new AbortController();
        const config = configFactory(params);
        if (showMessage) showMessageMap.add(config.url)
        return {
            request: request({ ...config, showMessage, signal: controller.signal }),
            cancel: () => controller.abort()
        };
    };
};

export default createRequestWrapper;