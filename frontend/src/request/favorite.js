import createRequestWrapper from ".";

/**
 * 我的收藏列表
 * 👉 必须自动取消
 */
export const getFavorites = createRequestWrapper(
  (params) => ({
    url: "/favorite",
    method: "get",
    params,
  })
);

/**
 * 添加收藏
 * 👉 必须自动取消
 */
export const addFavorite = createRequestWrapper(
  (params) => ({
    url: "/favorite",
    method: "post",
    data:params,
  })
);



/**
 * 删除收藏
 * 👉 必须自动取消
 */
export const deleteFavorite = createRequestWrapper(
  (params) => ({
    url: "/favorite",
    method: "delete",
    data:params,
  })
);