import path from "path";

export const uploadPath =( process.env.NODE_ENV === "production" ? process.env.PUBLIC_UPLOAD : path.resolve(process.env.PUBLIC_UPLOAD)).replace(/\\/g, "/");

export const appTokenExpire = process.env.APP_EXPIRE || 604800;



