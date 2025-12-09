// systemMonitor.js
const os = require("os");
const checkDiskSpace = require("check-disk-space").default;
const path = process.env.PUBLIC_FILE_PATCH;

/**
 * 获取 CPU 使用率
 */
function getCpuUsage(interval = 1000) {
    return new Promise((resolve) => {
        const cpus = os.cpus();

        function cpuAverage() {
            let totalIdle = 0, totalTick = 0;
            cpus.forEach(cpu => {
                for (let type in cpu.times) {
                    totalTick += cpu.times[type];
                }
                totalIdle += cpu.times.idle;
            });
            return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
        }

        const start = cpuAverage();

        setTimeout(() => {
            const end = cpuAverage();
            const idleDiff = end.idle - start.idle;
            const totalDiff = end.total - start.total;
            const usage = 100 - (100 * idleDiff / totalDiff);
            resolve(usage.toFixed(2));
        }, interval);
    });
}

/**
 * 获取系统监控信息
 */
async function getSystemInfo() {
    // 内存
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // CPU
    const cpuUsage = await getCpuUsage(); // 1秒延迟计算平均

    // CPU 详细信息
    const cpus = os.cpus().map(cpu => ({
        model: cpu.model,
        speed: cpu.speed
    }));

    // 硬盘
    const diskInfo = await checkDiskSpace(path);
    const usedDisk = diskInfo.size - diskInfo.free;

    return {
        cpu: {
            cores: cpus.length,
            usage: cpuUsage + '%',
            detail: cpus
        },
        memory: {
            total: totalMem,
            free: freeMem,
            used: usedMem,
            usage: ((usedMem / totalMem) * 100).toFixed(2) + '%'
        },
        disk: {
            total: diskInfo.size,
            free: diskInfo.free,
            used: usedDisk,
            usage: ((usedDisk / diskInfo.size) * 100).toFixed(2) + '%',
            path: diskInfo.diskPath
        }
    };
}



module.exports = async (ctx) => ctx.success(await getSystemInfo());