import request from ".";

export function userLogin(data) {
    return request({
        url: "/user/login",
        method: "post",
        data,
    });
}

export function initialize(data) {
    return request({
        url: "/user/initialize",
        method: "post",
        data,
    });
}

export function logout() {
    return request({
        url: "/user/logout",
        method: "post",
    });
}

export function userStatus() {
    return request({ url: "/user/status", method: "get" });
}

export function getUserInfo(data) {
    return request({
        url: "/user/userInfo",
        method: "get",
    });
}