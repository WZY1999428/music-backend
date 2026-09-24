
export function paginate(pageIndex = 1, pageSize = 20) {
    if (isNaN(parseInt(pageIndex))) pageIndex = 1;
    if (isNaN(parseInt(pageSize))) pageSize = 20;
    const offset = (pageIndex - 1) * pageSize;
    const limit = pageSize;
    return {
        offset,
        limit
    }
}
