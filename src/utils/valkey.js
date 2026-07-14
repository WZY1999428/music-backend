const Valkey = require("iovalkey");

const { VALKEY_PORT, VALKEY_HOST, VALKEY_PASSWORD, VALKEY_DB } = process.env;


class EnhancedValkey extends Valkey {
    constructor(options) {
        super(options);
    }



    #incrementCount = async (countKey, ttl = 300) => {
        const count = await this.incr(countKey);
        if (count === 1) await this.expire(countKey, ttl);
        return count;
    };

    #verificationCode = async (name, key, value) => {
        const codeCountKey = `${name}:verify:fail:${key}`
        const codeKey = `${name}:code:${key}`
        // 获取验证码
        const code = await this.get(codeKey)
        if (!code) throw new Error("验证码已过期或不存在")

        // 判断验证码
        if (code === value) {
            // 清空验证次数
            await this.del(codeCountKey)
            // 清空每小时发送次数 (暂时注释，后续可能需要)
            // await this.del(`${name}:send:hour:${key}`)
            // 清空验证码
            await this.del(codeKey)
            return true
        }
        // 判断验证码失败次数
        const mobilCodeCount = await this.#incrementCount(codeCountKey, 300)
        if (mobilCodeCount >= 5) {
            // 失败次数达到5次，删除验证码
            await this.del(codeKey)
            throw new Error("验证码错误次数过多，请稍后再试")
        }
        throw new Error("验证码错误")
    };

    #setVerificationCode = async (name, key, value) => {
        const hourKey = `${name}:send:hour:${key}`
        // 限制每小时 只能发送5次 除非 验证成功清空时间
        if ((await this.#incrementCount(hourKey, 3600)) > 5) {
            throw new Error("手机验证码发送过于频繁，请1小时后再试");
        }
        const dayKey = `${name}:send:day:${getDate()}:${key}`
        // 限制每天发送30次 直到凌晨重置 
        if ((await this.#incrementCount(dayKey, getSecondsLeftToday())) > 30) {
            throw new Error("今日验证码发送次数已达上限");
        }

        await this.set(`${name}:code:${key}`, value, "EX", 300);
    }


    setObject = async (key, value, ...args) => {
        if (typeof value === "object" && value !== null) value = JSON.stringify(value);
        await this.set(key, value, ...args);
    }

    getObject = async (key) => {
        const value = await this.get(key);
        if (value === null) return null;
        try {
            return JSON.parse(value);
        } catch {
            console.warn(`[Valkey Warning] Key "${key}" 的值无法被解析为 JSON,请使用valkey.get()获取原始值, 原值为:`, value);
            return null;
        }
    }

    getToken = async (key) => this.getObject(`token:${key}`);

    setToken = async (key, value, ...args) => await this.setObject(`token:${key}`, value, ...args)

    verifyMobileVerificationCode = async (phone, value) => await this.#verificationCode("mobile", phone, value)

    setMobileVerificationCode = async (phone, value) => await this.#setVerificationCode("mobile", phone, value)

    verifyEmailCode = async (email, value) => await this.#verificationCode("email", email, value)

    setEmailCode = async (email, value) => await this.#setVerificationCode("email", email, value)

    assertLoginAttemptLimit = async (key, ttl = 300) => {
        if ((await this.#incrementCount(`assertLoginAttemptLimit:${key}`, ttl)) > 5) throw new Error("登录尝试过于频繁，请稍后再试");
    };
    resettLoginAttemptLimit = async (key) => await this.del(`assertLoginAttemptLimit:${key}`);

    ipBlacklist = async (ip, ttl = 3600) => {
        await this.set(`ipBlacklist:${ip}`, 1, "EX", ttl);
    }
}

// 或者当天剩余秒数
function getSecondsLeftToday() {
    // 将时间直接设为今天的 23:59:59 毫秒设为 999
    const endOfDay = new Date().setHours(23, 59, 59, 999);
    return Math.ceil((endOfDay - Date.now()) / 1000);
}

function getDate() {
    // 1. 获取当前日期字符串，形如 "2026-07-13"
    return new Date().toISOString().split('T')[0]
}


const valkey = new EnhancedValkey({
    port: Number(VALKEY_PORT),
    host: VALKEY_HOST,
    password: VALKEY_PASSWORD,
    db: Number(VALKEY_DB),
});


valkey.on('error', (err) => console.error('Valkey Error:', err));

valkey.on('connect', () => console.log('Valkey connected'));









module.exports = valkey;