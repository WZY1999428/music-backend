import createRequestWrapper from ".";


export const userLogin = createRequestWrapper((data) => ({
    url: "/user/login",
    method: "post",
    data,
}));

export const initialize = createRequestWrapper((data) => ({
    url: "/user/initialize",
    method: "post",
    data,
}));


export const logout = createRequestWrapper((data) => ({
    url: "/user/logout",
    method: "get",
}));


export const userStatus = createRequestWrapper((data) => ({
    url: "/user/status", method: "get"
}));

export const getUserInfo = createRequestWrapper((data) => ({
    url: "/user/userInfo",
    method: "get",
}));
