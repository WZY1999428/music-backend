import request from ".";

export function getStorageStatus() {
    return request({
        url: "/storage/status",
        method: "get",
    });
}

