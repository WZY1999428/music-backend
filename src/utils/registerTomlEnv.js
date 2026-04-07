const toml = require("toml");
const fs = require("fs-extra");
const path = require("path");
const nodeEnv = process.env.NODE_ENV || 'development';
const tomlFile = path.resolve(`./env/${nodeEnv === "development" ? "development.toml" : "production.toml"}`);
function registerTomlEnv() {
    const obj = toml.parse(fs.readFileSync(tomlFile, "utf-8"));
    const parse = (obj, prefix = '') => {
        for (const key in obj) {
            const fullKey = prefix ? `${prefix}_${key.toUpperCase()}` : key.toUpperCase();
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                parse(obj[key], fullKey);
            } else {
                process.env[fullKey] = obj[key];
            }
        }
    }
    parse(obj);
}

module.exports = registerTomlEnv;