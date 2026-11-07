import { songAudioModel } from "@/database/model/music/song.js";
import uploadModel from "@/database/model/upload.js";
import fs from "node:fs";
import path from "node:path";
import { stat } from "node:fs/promises";
import valkey from "@/utils/valkey.js";

export default {
    action: "获取音乐流",
    logType: "API_GET_SONG_URL",
    enableLog: false,
    auth: false,
    /** @type {Controller} */
    handler: async (ctx) => {
        // 从查询参数中获取歌曲ID和音质
        const { songId, quality } = ctx.request.query;
        const songUrl = await valkey.get(`audioUrl:${songId}:${quality}`);
        if (songUrl) {
            // 读取并返回音频流
            await readAudio(songUrl, ctx)
            return;
        }
        // 校验歌曲ID
        if (!songId) {
            ctx.fail("歌曲ID不能为空");
            return;
        }

        // 准备查询字段：歌曲音频表的字段 + 上传表的URL字段
        const qualifyFields = songAudioModel.qualifyFields();
        qualifyFields.push(uploadModel.qualifyField("url"));
        const fileIdField = songAudioModel.qualifyField("fileId");
        // 聚合查询：通过关联上传表获取歌曲的音频文件URL
        const songList = await songAudioModel.aggregate({
            fields: qualifyFields,
            query: {
                [songAudioModel.qualifyField("songId")]: songId,
                [fileIdField]: { $col: "upload.id" },
            },
            joins: [{
                table: uploadModel.table,
                as: "upload",
                on: { [fileIdField]: "upload.id" },
            }],
        });

        // 检查歌曲是否存在
        if (!songList.length) {
            ctx.fail("歌曲不存在");
            return;
        }

        // 优先匹配指定音质，否则使用第一个音质
        const song = songList.find(item => item.quality == quality) ?? songList[0];

        // 获取音频文件路径
        const filePath = path.join(uploadPath, song.url);

        // 校验文件路径
        if (!filePath) {
            ctx.fail("音频文件不存在");
            return;
        }


        valkey.set(`audioUrl:${songId}:${quality}`, filePath, "EX", 60 * 30)

        // 读取并返回音频流
        await readAudio(filePath, ctx)
    },
};


/**
 * 读取音频文件并支持 Range 请求（断点续传）
 * @param {string} filePath - 音频文件路径
 * @param {object} ctx - Koa 上下文对象
 */
async function readAudio(filePath, ctx) {

    let fileStat;

    // 获取文件状态信息
    try {
        fileStat = await stat(filePath);
    } catch (err) {
        // 文件不存在
        if (err.code === "ENOENT") {
            ctx.fail("音频文件不存在");
            return;
        }
        throw err;
    }

    // 确保是文件而非目录
    if (!fileStat.isFile()) {
        ctx.fail("音频文件不存在");
        return;
    }

    const fileSize = fileStat.size;
    const contentType = getAudioContentType(filePath);

    // 设置响应头：支持 Range 请求
    ctx.set("Accept-Ranges", "bytes");
    ctx.set("Content-Type", contentType);
    ctx.set("Cache-Control", "private, no-cache");

    // HEAD 请求只返回响应头，不返回文件内容
    if (ctx.method === "HEAD") {
        ctx.status = 200;
        ctx.length = fileSize;
        return;
    }

    const rangeHeader = ctx.get("Range");

    // 没有 Range 请求头，返回完整文件
    if (!rangeHeader) {
        ctx.status = 200;
        ctx.length = fileSize;
        ctx.body = fs.createReadStream(filePath);
        return;
    }

    // 本接口只支持单个 bytes Range 请求
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());

    // Range 格式无效或文件大小为0，返回 416 错误
    if (!match || fileSize === 0) {
        ctx.status = 416;
        ctx.set("Content-Range", `bytes */${fileSize}`);
        ctx.body = "";
        return;
    }

    const [, startText, endText] = match;

    let start;
    let end;

    // 两个位置都为空，格式错误
    if (startText === "" && endText === "") {
        ctx.status = 416;
        ctx.set("Content-Range", `bytes */${fileSize}`);
        ctx.body = "";
        return;
    }


    if (startText === "") {
        // bytes=-500：请求文件最后 500 字节
        const suffixLength = Number(endText);

        // 校验后缀长度是否为有效整数
        if (
            !Number.isSafeInteger(suffixLength) ||
            suffixLength <= 0
        ) {
            ctx.status = 416;
            ctx.set("Content-Range", `bytes */${fileSize}`);
            ctx.body = "";
            return;
        }

        // 计算起始位置和结束位置
        start = Math.max(0, fileSize - suffixLength);
        end = fileSize - 1;
    } else {
        // bytes=0-999 或 bytes=500-：指定起始位置
        start = Number(startText);
        end = endText === "" ? fileSize - 1 : Number(endText);

        // 校验起始和结束位置是否有效
        if (
            !Number.isSafeInteger(start) ||
            !Number.isSafeInteger(end) ||
            start < 0 ||
            start >= fileSize ||
            end < start
        ) {
            ctx.status = 416;
            ctx.set("Content-Range", `bytes */${fileSize}`);
            ctx.body = "";
            return;
        }

        // 结束位置超过文件末尾时，截断到最后一个字节
        end = Math.min(end, fileSize - 1);
    }

    // 计算本次返回的内容长度
    const contentLength = end - start + 1;

    // 返回 206 Partial Content 状态码
    ctx.status = 206;
    ctx.set("Content-Range", `bytes ${start}-${end}/${fileSize}`);
    ctx.length = contentLength;
    // 创建文件流，只读取指定范围的数据
    const stream = fs.createReadStream(filePath, { start, end });
    ctx.body = stream
}

/**
 * 根据文件扩展名获取音频文件的 MIME 类型
 * @param {string} filePath - 文件路径
 * @returns {string} MIME 类型
 */
function getAudioContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const types = {
        ".mp3": "audio/mpeg",
        ".m4a": "audio/mp4",
        ".aac": "audio/aac",
        ".ogg": "audio/ogg",
        ".opus": "audio/opus",
        ".flac": "audio/flac",
        ".wav": "audio/wav",
        ".webm": "audio/webm",
        ".aiff": "audio/aiff",
        ".aif": "audio/aiff",
    };

    // 返回对应的 MIME 类型，未知扩展名返回通用二进制流类型
    return types[ext] ?? "application/octet-stream";
}