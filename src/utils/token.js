import valkey from "./valkey.js";
export async function generateAdminToken(data) {
    const rawUuid = crypto.randomUUID();
    const token = rawUuid.replace(/-/g, '');
    await valkey.setToken(token, data, "admin-api", "EX", process.env.JWT_EXPIRE);
    return token;
}

export async function getAdminToken(key) {
    return await valkey.getToken(key);
}



export async function generateAppToken(data) {
    const rawUuid = crypto.randomUUID();
    const token = rawUuid.replace(/-/g, '');
    await valkey.setToken(token, data, "app-api", "EX", process.env.JWT_EXPIRE);
    return token;
}


export default async function getAppToken(key) {
    return await valkey.getToken(key);
}
