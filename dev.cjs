const { spawn } = require('node:child_process');

const env = {
    ...process.env,
    NODE_ENV: 'development'
};

let swc = null;
let node = null;
let nodeStarted = false;
let shuttingDown = false;

/**
 * 启动 Node
 */
function startNode() {
    if (nodeStarted || shuttingDown) {
        return;
    }

    nodeStarted = true;

    console.log('\n[NODE] Starting...\n');

    node = spawn(
        'node',
        ['--watch', '.output/index.js'],
        {
            env,
            shell: true,
            stdio: ['inherit', 'pipe', 'pipe']
        }
    );

    node.stdout.on('data', (data) => {
        process.stdout.write(`[NODE] ${data}`);
    });

    node.stderr.on('data', (data) => {
        process.stderr.write(`[NODE] ${data}`);
    });

    node.on('error', (err) => {
        console.error('[NODE] Failed to start:', err);
    });

    node.on('exit', (code, signal) => {
        if (shuttingDown) {
            return;
        }

        console.log(
            `[NODE] Exited. code=${code}, signal=${signal ?? 'none'}`
        );

        node = null;
        nodeStarted = false;
    });
}

/**
 * 启动 SWC
 */
function startSwc() {
    console.log('[SWC] Starting...\n');

    swc = spawn(
        'npx',
        [
            'swc',
            'src',
            '-w',
            '--out-dir',
            '.output',
            '--strip-leading-paths',
            '--copy-files'
        ],
        {
            env,
            shell: true,
            stdio: ['inherit', 'pipe', 'pipe']
        }
    );

    let stdoutBuffer = '';

    swc.stdout.on('data', (data) => {
        const text = data.toString();

        // 正常输出
        process.stdout.write(`[SWC] ${text}`);

        // 防止一行输出被拆成多个 chunk
        stdoutBuffer += text;

        if (
            !nodeStarted &&
            stdoutBuffer.includes('Watching for file changes.')
        ) {
            startNode();
        }

        // 防止 buffer 无限增长
        if (stdoutBuffer.length > 4096) {
            stdoutBuffer = stdoutBuffer.slice(-1024);
        }
    });

    swc.stderr.on('data', (data) => {
        process.stderr.write(`[SWC] ${data}`);
    });

    swc.on('error', (err) => {
        console.error('[SWC] Failed to start:', err);
        shutdown(1);
    });

    swc.on('exit', (code, signal) => {
        if (shuttingDown) {
            return;
        }

        console.log(
            `\n[SWC] Exited. code=${code}, signal=${signal ?? 'none'}`
        );

        // SWC 挂了，Node 也没必要继续跑
        shutdown(code ?? 1);
    });
}

/**
 * 关闭所有子进程
 */
function shutdown(code = 0) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    console.log('\n\n[DEV] Shutting down...');

    if (node) {
        node.kill();
        node = null;
    }

    if (swc) {
        swc.kill();
        swc = null;
    }

    process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

startSwc();