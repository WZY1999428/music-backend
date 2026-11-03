
import {
    randomBytes,
    scrypt,
    timingSafeEqual
} from "node:crypto";

import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;

/**
 * 密码哈希
 * @param {string} password 原始密码
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
    const salt = randomBytes(16).toString("hex");

    const hash = await scryptAsync(password, salt, KEY_LENGTH, {
        N: 16384,
        r: 8,
        p: 1,
        maxmem: 64 * 1024 * 1024
    });

    return `scrypt$${salt}$${hash.toString("hex")}`;
}

/**
 * 验证密码
 * @param {string} password 用户输入的密码
 * @param {string} hashedPassword 数据库存储的哈希
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hashedPassword) {
    try {
        const [algorithm, salt, hash] = hashedPassword.split("$");

        if (algorithm !== "scrypt" || !salt || !hash) {
            return false;
        }

        const originalHash = Buffer.from(hash, "hex");

        if (originalHash.length !== KEY_LENGTH) {
            return false;
        }

        const derivedHash = await scryptAsync(
            password,
            salt,
            KEY_LENGTH,
            {
                N: 16384,
                r: 8,
                p: 1,
                maxmem: 64 * 1024 * 1024
            }
        );

        return timingSafeEqual(originalHash, derivedHash);

    } catch {
        return false;
    }
}
