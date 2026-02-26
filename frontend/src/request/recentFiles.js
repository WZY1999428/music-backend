import createRequestWrapper from ".";

/**
 * 最近访问列表
 * 👉 必须自动取消
 */
export const getRecentFiles = createRequestWrapper(
  (params) => ({
    url: "/recentFiles",
    method: "get",
    params,
  })
);

/**
 * 删除最近访问
 * 👉 必须自动取消
 */
export const deleteRecentFiles = createRequestWrapper(
  (params) => ({
    url: "/recentFiles",
    method: "delete",
    data:params,
  })
);
