import axios from "axios";
import { getItem } from "@/utils/storage"

const request = axios.create({
    baseURL: "/api/",
    timeout: 5000
})

request.interceptors.response.use(res => {
    const data = res.data;
    if (data.code !== 0) {
        return Promise.reject(data)
    }

    return data;
}, error => {
    console.log(error);

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