import request from ".";

export function getFiles(params) {
    return request({
        url: "/files",
        method: "get",
        params,
    });
}
export function getCategoryFiles(params) {
    return request({
        url: "/files/category",
        method: "get",
        params,
    });
}


export function download(fileId, access_token) {
    return request({
        url: "/files/" + fileId,
        method: "get",
        responseType: "blob",
        params: { access_token }
    });
}