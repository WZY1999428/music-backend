import { handler } from "@/router/admin-api/upload/public.post.js"
import multer from "@koa/multer";
import fs from "node:fs/promises";
import path from "node:path";
const imgExt = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp"])

const upload = multer({
    storage: multer.diskStorage({
        async destination(_req, file, cb) {
            const now = new Date();
            const ext = path.extname(file.originalname);
            if (!imgExt.has(ext.toLowerCase())) {
                return cb(new Error("只支持上传 png、jpeg、gif、webp 格式的文件"));
            }
            const savePath = `${uploadPath}/cover`;
            const dir = path.join(
                savePath,
                now.getFullYear().toString(),
                String(now.getMonth() + 1).padStart(2, "0"),
                String(now.getDate()).padStart(2, "0")
            );
            await fs.mkdir(dir, { recursive: true });
            cb(null, dir);
        },

        filename(_req, file, cb) {
            const name = Buffer.from(file.originalname, 'latin1').toString('utf8')
            cb(null, `${Date.now()}-${name}`);
        }
    })
});

export default {
    action: "app上传封面",
    logType: "UPLOAD_COVER",
    auth: false,
    enableLog: false,
    middleware: [upload.fields([{ name: "file", maxCount: 1 }])],
    /** @type {Controller} */
    handler
};