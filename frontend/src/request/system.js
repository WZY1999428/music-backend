import createRequestWrapper from ".";

export const getStorageStatus = createRequestWrapper(() => ({
    url: "/storage/status",
    method: "get",
}), { autoCancel: false });

