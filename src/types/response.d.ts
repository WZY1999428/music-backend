import { Context } from 'koa';
import Valkey from "iovalkey";


declare class EnhancedValkey extends Valkey {
    constructor(options?: any): void
    #incrementCount(countKey: string, ttl: number): Promise<boolean>

    #verificationCode(name: string, key: string, value: any): Promise<boolean>

    #setVerificationCode(name: string, key: string, value: any): Promise<void>

    setObject(key: string, value: any, ...args: any[]): Promise<"OK">
    getObject<T>(key: string): Promise<T | null>

    getToken<T>(key: string): Promise<T | null>

    setToken<T>(key: string, value: T, ...args: any[]): Promise<"OK">

    verifyMobileVerificationCode(phone: string, value: string): Promise<boolean>

    setMobileVerificationCode(phone: string, value: string): Promise<void>

    verifyEmailCode(email: string, value: string): Promise<boolean>

    setEmailCode(email: string, value: string): Promise<void>

    assertLoginAttemptLimit(key: string, ttl: number = 300): Promise<void>
    resettLoginAttemptLimit(key: string): Promise<void>
    ipBlacklist(ip: string, ttl: number = 3600)
}


declare module 'koa' {
    interface BaseContext {
        success: (data?: any, message?: string) => void;
        // fail: (message: string) => void;
        // notFound: () => void;
        // unauthorized: () => void;
        valkey: EnhancedValkey
    }
}
