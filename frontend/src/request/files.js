import createRequestWrapper from ".";

/**
 * 文件列表（tabs / 搜索 / 分页）
 * 👉 必须自动取消
 */
export const getFiles = createRequestWrapper(
  (params) => ({
    url: "/files",
    method: "get",
    params,
  })
);

/**
 * 分类文件（tabs 切换）
 * 👉 必须自动取消
 */
export const getCategoryFiles = createRequestWrapper(
  (params) => ({
    url: "/files/category",
    method: "get",
    params,
  })
);

/**
 * 收藏列表
 * 👉 通常也是 tab / 列表
 */
export const getFavorite = createRequestWrapper(
  (params) => ({
    url: "/favorite",
    method: "get",
    params,
  })
);

export const deleteFile = createRequestWrapper((data) => ({
  url: "/files/rm",
  method: "delete",
  data,
}),
  { autoCancel: false }
);

/**
 * 下载文件
 * 👉 禁止 autoCancel
 * 👉 否则切一次 tab，下载就没了
 */
export const download = createRequestWrapper(({ fileId, access_token }) => ({
  url: "/files/" + fileId,
  method: "get",
  responseType: "blob",
  params: { access_token },
}),
  { autoCancel: false }
);




export const createFolder = createRequestWrapper((data) => ({
  url: "/files/create",
  method: "post",
  data,
}));


export const copyFile = createRequestWrapper((data) => ({
  url: "/files/copy",
  method: "put",
  data,
}))



export const mvFile = createRequestWrapper((data) => ({
  url: "/files/mv",
  method: "put",
  data,
}))




export const syncFile = createRequestWrapper((data) => ({
  url: "/files/sync",
  method: "get",
  params: data,
}));
