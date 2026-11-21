import path from "path";

export const uploadPath = path.resolve(process.env.PUBLIC_UPLOAD).replace(/\\/g, "/");

export const appTokenExpire = process.env.APP_EXPIRE || 604800;



