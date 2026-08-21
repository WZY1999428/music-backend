import valkey from "./valkey.js";
export default async function generateToken(data) {
    const rawUuid = crypto.randomUUID();
    const token = rawUuid.replace(/-/g, '');
    await valkey.setObject(token, data, "EX", process.env.JWT_EXPIRE);
    return token;
}

