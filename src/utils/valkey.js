const Valkey = require("iovalkey");

const { VALKEY_PORT, VALKEY_HOST, VALKEY_USERNAME, VALKEY_PASSWORD, VALKEY_DB } = process.env;

const valkey = new Valkey({
    port: Number(VALKEY_PORT),
    host: VALKEY_HOST,
    // username: VALKEY_USERNAME,
    password: VALKEY_PASSWORD,
    db: Number(VALKEY_DB),
});


valkey.on('error', (err) => console.error('Valkey Error:', err));

valkey.on('connect', () => console.log('Valkey connected'));

valkey.setObject = async (key, value, ...args) => {
    if (typeof value === "object" && value !== null) {
        value = JSON.stringify(value);
    }
    await valkey.set(key, value, ...args);
}


valkey.getObject = async (key) => {
    const value = await valkey.get(key);
    if (value == null) {
        return null;
    }
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

module.exports = valkey;