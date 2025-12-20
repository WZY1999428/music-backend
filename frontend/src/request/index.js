import axios from "axios";
// import { getItem, clearStorage } from "@/utils/storage"
import { ElMessage } from "element-plus";
import router from "@/router";
const request = axios.create({
    baseURL: "/api/",
    timeout: 5000
})

request.interceptors.response.use(res => {
    const data = res.data;
    if (data.code !== 0 && res.headers['content-type'] != "application/octet-stream") {
        return Promise.reject(data)
    }

    return data;
}, error => {
    console.log(error.request.responseURL);
    const skipLoginPrompt = /^\/api\/files\/\d+$/.test(new URL(error.request.responseURL).pathname);
    if (error.status == 401 && !skipLoginPrompt) {
        ElMessage.error(getItem('token') ? "登录已过期，请重新登录" : "未登录请先登录");
        clearStorage();
        router.replace('/login');
    }

    return Promise.reject(error);
})
request.interceptors.request.use(config => {
    const token = getItem('token')
    if (token) config.headers.authorization = `Bearer ${token}`
    return config
}, error => {
    return Promise.reject(error)
})


export default request