import { Context } from 'koa';

declare module 'koa' {
    interface Context {
        success: (data?: any, message?: string) => void;
        fail: (message: string) => void;
        notFound: () => void;
        unauthorized: () => void;
    }
}
