// middleware/rangeFile.js
const fs = require('fs');
const path = require('path');
const crypto= require('crypto');
const mime = require('mime-types');
module.exports = function  rangeFile(rootDir) {
  return async (ctx, next) => {
    try {
      const requestPath = decodeURIComponent(ctx.path);
      const filePath = path.join(rootDir, requestPath);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        return next(); // 目录或者不存在 → 交给下一个中间件
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;

      const ext = path.extname(filePath);
      const contentType = mime.lookup(ext) || "application/octet-stream";

      // 生成 ETag（基于 inode + size + mtime）
      const etag = crypto
        .createHash("md5")
        .update(`${stat.ino}-${stat.size}-${stat.mtimeMs}`)
        .digest("hex");

      ctx.set("ETag", etag);
      ctx.set("Last-Modified", stat.mtime.toUTCString());
      ctx.set("Accept-Ranges", "bytes");
      ctx.set("Content-Type", contentType);

      // -------------------------
      // 处理 If-None-Match / 304
      // -------------------------
      if (ctx.headers["if-none-match"] === etag) {
        ctx.status = 304;
        return;
      }

      if (ctx.method === "HEAD") {
        ctx.status = 200;
        ctx.set("Content-Length", fileSize);
        return;
      }

      const rangeHeader = ctx.headers.range;

      // -------------------------
      // 处理 Range 请求
      // -------------------------
      if (rangeHeader) {
        const ranges = rangeHeader
          .replace(/bytes=/, "")
          .split(",")
          .map((r) => {
            const [startStr, endStr] = r.split("-");
            const start = startStr ? parseInt(startStr, 10) : 0;
            const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
            return { start, end };
          });

        // 如果只请求一个 Range
        if (ranges.length === 1) {
          const { start, end } = ranges[0];
          if (start >= fileSize || end >= fileSize || start > end) {
            ctx.status = 416;
            ctx.set("Content-Range", `bytes */${fileSize}`);
            return;
          }

          ctx.status = 206;
          ctx.set("Content-Range", `bytes ${start}-${end}/${fileSize}`);
          ctx.set("Content-Length", end - start + 1);
          ctx.body = fs.createReadStream(filePath, { start, end });
          return;
        }

        // 如果请求多个 Range → multipart/byteranges
        const boundary = crypto.randomBytes(16).toString("hex");
        ctx.status = 206;
        ctx.set("Content-Type", `multipart/byteranges; boundary=${boundary}`);

        const streams = ranges.map(({ start, end }) => {
          return {
            header: `--${boundary}\r\nContent-Type: ${contentType}\r\nContent-Range: bytes ${start}-${end}/${fileSize}\r\n\r\n`,
            stream: fs.createReadStream(filePath, { start, end }),
          };
        });

        ctx.body = new (require("stream").Readable)({
          async read() {
            for (const { header, stream } of streams) {
              this.push(header);
              for await (const chunk of stream) {
                this.push(chunk);
              }
              this.push("\r\n");
            }
            this.push(`--${boundary}--\r\n`);
            this.push(null);
          },
        });

        return;
      }

      // -------------------------
      // 普通下载 / 浏览
      // -------------------------
      ctx.status = 200;
      ctx.set("Content-Length", fileSize);
      ctx.body = fs.createReadStream(filePath);
    } catch (err) {
      if (["ECONNRESET", "ECONNABORTED", "ERR_STREAM_PREMATURE_CLOSE"].includes(err.code)) {
        return; // 忽略客户端断开
      }
      throw err;
    }
  };
}