
export function paginate(pageIndex = 1, pageSize = 20) {
    if (typeof pageIndex !== "number") pageIndex = 1;
    if (typeof pageSize !== "number") pageSize = 20;
    const offset = (pageIndex - 1) * pageSize;
    const limit = pageSize;
    return {
        offset,
        limit
    }
}
