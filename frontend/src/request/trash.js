import createRequestWrapper from ".";

export const getRecycleBin = createRequestWrapper((params) => ({
    url: "/trash",
    method: "get",
    params,
}), { autoCancel: false });


export const recentlyFiles = createRequestWrapper((data) => ({
    url: "/trash/restore",
    method: "post",
    data,
}), { autoCancel: false });

