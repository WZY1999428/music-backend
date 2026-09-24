import fs from 'node:fs';
import Stream from 'node:stream';


export default () => {
  return async (ctx, next) => {
    const range = ctx.get('Range');
    if (!range) {
      return next();
    }

    ctx.set('Accept-Ranges', 'bytes');

    if (ctx.method !== 'GET' && ctx.method !== 'HEAD') {
      return next();
    }

    const ranges = parseRange(range);

    if (!ranges?.length) {
      ctx.status = 416;
      return;
    }

    await next();

    if (ctx.body == null) {
      return;
    }

    const [rangeStart, rangeEnd] = ranges[0];

    let total = ctx.length;

    // koa-static 通常这里是 ReadStream
    if (ctx.body instanceof Stream.Readable) {
      if (!Number.isInteger(total)) {
        ctx.status = 200;
        return;
      }

      const stream = ctx.body;

      // koa-static 的 stream 通常具有 path
      if (!stream.path) {
        ctx.status = 200;
        return;
      }

      let start = rangeStart;
      let end = rangeEnd;

      if (start === null) {
        start = Math.max(total - end, 0);
        end = total - 1;
      }

      if (end === null) {
        end = total - 1;
      }

      if (start >= total || start > end) {
        ctx.status = 416;
        ctx.set('Content-Range', `bytes */${total}`);
        stream.destroy();
        return;
      }

      end = Math.min(end, total - 1);

      const length = end - start + 1;

      // 关闭 koa-static 原来的 stream
      stream.destroy();

      // 重新创建指定范围的文件流
      ctx.body = fs.createReadStream(stream.path, {
        start,
        end
      });

      ctx.status = 206;

      ctx.set(
        'Content-Range',
        `bytes ${start}-${end}/${total}`
      );

      ctx.set(
        'Content-Length',
        String(length)
      );

      ctx.length = length;

      return;
    }

    // Buffer
    if (Buffer.isBuffer(ctx.body)) {
      total = ctx.body.length;

      let start = rangeStart;
      let end = rangeEnd;

      if (start === null) {
        start = Math.max(total - end, 0);
        end = total - 1;
      }

      if (end === null) {
        end = total - 1;
      }

      if (start >= total || start > end) {
        ctx.status = 416;
        ctx.set('Content-Range', `bytes */${total}`);
        return;
      }

      end = Math.min(end, total - 1);

      ctx.status = 206;

      ctx.set(
        'Content-Range',
        `bytes ${start}-${end}/${total}`
      );

      ctx.body = ctx.body.subarray(start, end + 1);
      ctx.length = end - start + 1;

      return;
    }
  }
}



function parseRange(value) {
  const match = /^bytes=(.+)$/.exec(value);

  if (!match) {
    return null;
  }

  return match[1]
    .split(',')
    .map(item => {
      const [startText, endText] = item.trim().split('-');

      // bytes=-500
      if (!startText) {
        const suffix = Number(endText);

        if (!Number.isInteger(suffix) || suffix <= 0) {
          return null;
        }

        return [null, suffix];
      }

      const start = Number(startText);

      if (!Number.isInteger(start) || start < 0) {
        return null;
      }

      // bytes=500-
      if (!endText) {
        return [start, null];
      }

      const end = Number(endText);

      if (!Number.isInteger(end) || end < start) {
        return null;
      }

      return [start, end];
    })
    .filter(Boolean);
}