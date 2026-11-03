import { uploadMulter, handler } from "@/router/admin-api/upload/avatar.post.js"
export default {
    action: "app上传头像文件",
    logType: "UPLOAD_AVATAR_FILE",
    middleware: [uploadMulter.fields([{ name: "avatar", maxCount: 1 }])],
    /** @type {Controller} */
    handler
};