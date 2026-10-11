import valkey from "@/utils/valkey.js";

export default () => {
    return async (ctx, next) => {
        const token = ctx.headers["authorization"]
        const user = await valkey.getToken(token)
        const isAdmin = ctx.path.startsWith("/admin-api");
        await next();
        if (!isAdmin) {
            const ttl = await valkey.getTokenTtl(token)
            if (ttl < 60 * 60 * 24) {

                const lockKey = `token:renew:${token}`;
                if (await valkey.get(lockKey)) {
                    return;
                }

                await valkey.set(lockKey, 1, 'EX', 10);

                await valkey.setTokenTtl(token, 60 * 60 * 24);

                ctx.set('X-Token', await generateToken(user));

            }
        }
    }
}


