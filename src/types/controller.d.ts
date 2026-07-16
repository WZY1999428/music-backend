import { Context } from "koa";

declare global {
    type Controller = (ctx: Context) => Promise<void>;
}

export {};