module.exports = () => {
    return async (ctx, next) => {
        ctx.path = ctx.path.replace(/\/+/g, "/");

        ctx.success = (data, message = "操作成功") => {
            ctx.body = {
                code: 0,
                data,
                message
            };
        };

        // ctx.fail = (message) => {
        //     ctx.body = {
        //         code: 1,
        //         message
        //     };
        // };

        // ctx.notFound = () => {
        //     ctx.status = 404;
        //     ctx.body = htmlTemplate('404');
        // };

        // ctx.unauthorized = () => {
        //     ctx.status = 401;
        //     ctx.body = "Unauthorized";
        // };

        try {
            await next();
            if (ctx.status === 404 && !ctx.body) {
                ctx.notFound();
            } else if (ctx.status === 403) {
                ctx.body = htmlTemplate('403');
            }
        } catch (error) {
            if (error.name == "AppError") {
                ctx.body = {
                    code: 1,
                    message: error.message
                };
                ctx.status = error.status
            }

        }

    }
}


function htmlTemplate(status) {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>提示</title>
    <style>
        :root {
            --bg-color: #f8f9fa;
            --text-main: #212529;
            --text-muted: #6c757d;
            --accent-color: #000000;
            --border-color: #e9ecef;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #121212;
                --text-main: #f8f9fa;
                --text-muted: #868e96;
                --accent-color: #ffffff;
                --border-color: #2b2b2b;
            }
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            line-height: 1.6;
            transition: background-color 0.3s, color 0.3s;
        }

        .container {
            text-align: center;
            padding: 2rem;
            max-width: 480px;
            width: 100%;
        }

        /* 状态码大数字 */
        .error-code {
            font-size: 7.5rem;
            font-weight: 200;
            letter-spacing: -2px;
            line-height: 1;
            margin-bottom: 1.5rem;
            color: var(--accent-color);
            position: relative;
            display: inline-block;
        }

        /* 状态描述标题 */
        .error-title {
            font-size: 1.25rem;
            font-weight: 500;
            margin-bottom: 1rem;
            letter-spacing: 1px;
        }

        /* 分割线 */
        .divider {
            width: 40px;
            height: 1px;
            background-color: var(--border-color);
            margin: 1.5rem auto;
        }

        /* 详细提示文本 */
        .error-message {
            font-size: 0.9rem;
            color: var(--text-muted);
            margin-bottom: 2.5rem;
            word-break: break-all;
        }

        /* 极简按钮 */
        .actions {
            display: flex;
            justify-content: center;
            gap: 1.5rem;
        }

        .btn {
            font-size: 0.85rem;
            text-decoration: none;
            color: var(--text-muted);
            padding: 0.5rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            transition: all 0.2s ease;
        }

        .btn:hover {
            color: var(--accent-color);
            border-color: var(--accent-color);
            background-color: rgba(0, 0, 0, 0.02);
        }

        @media (prefers-color-scheme: dark) {
            .btn:hover {
                background-color: rgba(255, 255, 255, 0.05);
            }
        }
        body.status-404 .show-403 { display: none; }
        body.status-403 .show-404 { display: none; }
    </style>
</head>
<body class="${status == 404 ? 'status-404' : 'status-403'}">

    <div class="container">
        <div class="error-code">
            <span class="show-404">404</span>
            <span class="show-403">403</span>
        </div>

        <div class="error-title">
            <span class="show-404">PAGE NOT FOUND</span>
            <span class="show-403">ACCESS DENIED</span>
        </div>

        <div class="divider"></div>

        <div class="error-message">
            <span class="show-404">抱歉，您访问的页面不存在或已被移除。</span>
            <span class="show-403">抱歉，您没有权限访问该受保护的页面。</span>
        </div>

        <div class="actions">
            <a href="javascript:history.back();" class="btn">返回上一页</a>
            <a href="/" class="btn">回到首页</a>
        </div>
    </div>

</body>
</html>`
}