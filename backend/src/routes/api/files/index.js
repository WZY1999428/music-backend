const fs = require('fs/promises');
const path = require('path');
const rootDir = process.env.PUBLIC_FILE_PATCH;
console.log(rootDir);


module.exports = async (ctx) => {
    const files = await fs.readdir(rootDir);
    const fileList = [];
    for (const item of files) {
        const fullPath = path.join(rootDir, item);
        try {
            const stat = await fs.stat(fullPath);
            fileList.push(makeFileInfo(fullPath, stat));
        } catch (error) {
            if (error.code === 'EPERM') {
                console.warn(`权限不足，跳过文件/目录: ${fullPath}`);
            }
        }
    }
    ctx.body = fileList;
};

function makeFileInfo(filePath, stats) {
    return {
        name: path.basename(filePath),
        path: path.relative(rootDir, filePath),
        size: stats.size,
        isDirectory: stats.isDirectory(),
        mtime: stats.mtime,
    };
}
