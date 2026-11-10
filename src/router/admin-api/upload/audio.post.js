import uploadModel from "@/database/model/upload.js";
import artistModel from "@/database/model/music/artist.js";

import fs from "node:fs";
import path from "node:path";
import multer from "@koa/multer";
import { parseFile } from 'music-metadata';
const audioExt = new Set([".flac", ".mp3", ".wav", ".ogg"])
const upload = multer({
    storage: multer.diskStorage({
        destination(_req, _file, cb) {
            const dir = path.join(`${uploadPath}/audio`);
            fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename(_req, file, cb) {
            const ext = path.extname(file.originalname);
            if (!audioExt.has(ext.toLowerCase())) {
                return cb(new Error("只支持上传 flac、mp3、wav、ogg 格式的文件"));
            }
            if (file.size > 1024 * 1024 * 100) {
                return cb(new Error("文件大小不能超过100MB"));
            }
            cb(null, `${Date.now()}${ext}`);
        }
    })
});

export default {
    action: "上传音乐文件",
    logType: "UPLOAD_AUDIO_FILE",
    middleware: [upload.fields([{ name: "song", maxCount: 1 }])],
    /** @type {Controller} */
    handler: async (ctx) => {
        const file = ctx.files?.song?.[0];
        $validate(file, "请选择要上传的文件");
        const matedata = await parseFile(file.path);
        if (!matedata.format) {
            return ctx.fail("音频解析失败")
        }
        let artists = []
        if (matedata.common && matedata.common.artist.length) {
            artists = await artistModel.findMany({
                name: { $in: matedata.common.artists }
            }, { fields: ["id", "name"] })
        }

        const url = file.path.replace(/\\/g, "/").replace(uploadPath, "/");

        const result = await uploadModel.insertOne({
            originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
            filename: file.filename,
            userId: ctx.user?.userId,
            url: url,
            size: file.size,
            mimeType: file.mimetype,
            type: "audio"
        })

        ctx.success({
            fileId: result.insertId,
            url: url,
            filename: file.filename,
            size: file.size,
            ...matedata.format,
            ...matedata.common,
            artists
        });
    }
};


