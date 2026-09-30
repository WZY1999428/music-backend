export default function normalizeQueryArray() {
    return async (ctx, next) => {
        const query = ctx.request.query
        if (query) {
            for (const key of Object.keys(query)) {
                if (!key.endsWith('[]')) {
                    continue
                }
                const normalizedKey = key.slice(0, -2)
                const value = query[key]
                query[normalizedKey] = Array.isArray(value) ? value : [value]
                delete query[key]
            }
        }
        await next()
    }
}