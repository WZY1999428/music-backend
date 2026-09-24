import fs from "node:fs";
import path from "node:path";
import multer from "@koa/multer";
const imgExt = new Set([".png", ".jpeg", ".gif", ".webp"])
const upload = multer({
    storage: multer.diskStorage({
        destination(_req, _file, cb) {
            const now = new Date();
            const dir = path.join(
                "public/avatar",
                now.getFullYear().toString(),
                String(now.getMonth() + 1).padStart(2, "0"),
                String(now.getDate()).padStart(2, "0")
            );
            fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },

        filename(_req, file, cb) {
            const ext = path.extname(file.originalname);
            if (!imgExt.has(ext.toLowerCase())) {
                return cb(new Error("只支持上传 png、jpeg、gif、webp 格式的文件"));
            }
            if (file.size > 1024 * 1024 * 2) {
                return cb(new Error("文件大小不能超过2MB"));
            }
            const name = path.basename(file.originalname, ext);
            cb(null, `${Date.now()}-${name}${ext}`);
        }
    })
});

export default {
    action: "上传头像文件",
    logType: "UPLOAD_AVATAR_FILE",
    middleware: [upload.fields([{ name: "avatar", maxCount: 1 }])],
    /** @type {Controller} */
    handler: async (ctx) => {
        const file = ctx.files?.avatar?.[0];
        $validate(file, "请选择要上传的文件");
        ctx.success({
            url: file.path.replaceAll("\\", "/").replace("public/", "/"),
            name: file.filename,
            size: file.size,
        });
    }
};