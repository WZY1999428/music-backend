import fs from "node:fs";
import path from "node:path";
import multer from "@koa/multer";
import uploadModel from "@/database/model/upload.js";

const upload = multer({
    storage: multer.diskStorage({
        destination(req, _file, cb) {
            const now = new Date();
            let savePath = req.body.path;
            if (!savePath) savePath = `${uploadPath}/uploads`;
            else savePath = `${uploadPath}/${savePath}`
            const dir = path.join(
                savePath,
                now.getFullYear().toString(),
                String(now.getMonth() + 1).padStart(2, "0"),
                String(now.getDate()).padStart(2, "0")
            );
            fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },

        filename(_req, file, cb) {
            const name = Buffer.from(file.originalname, 'latin1').toString('utf8')
            cb(null, `${Date.now()}-${name}`);
        }
    })
});

export default {
    action: "上传文件",
    logType: "UPLOAD_FILE",
    middleware: [upload.fields([{ name: "file", maxCount: 1 }])],
    /** @type {Controller} */
    handler: async (ctx) => {
        const file = ctx.files?.file?.[0];
        $validate(file, "请选择要上传的文件");
        const type = ctx.request.body.type || "public";
        const fileInfo = {
            originalName: file.originalname,
            filename: file.filename,
            userId: ctx.user?.userId,
            url: file.path.replace(/\\/g, "/").replace(`${uploadPath}/`, "/"),
            size: file.size,
            mimeType: file.mimetype,
            type
        };
        const result = await uploadModel.insertOne(fileInfo);
        fileInfo.id = result.insertId;
        ctx.success(fileInfo);
    }
};