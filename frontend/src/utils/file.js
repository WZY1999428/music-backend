/**
 * Format a file size in bytes into a human-readable string.
 *
 * @param {number} bytes - The file size in bytes.
 * @param {Object} options - Optional configuration options.
 * @param {number} [options.decimals=2] - The number of decimal places to round to.
 * @param {number} [options.base=1024] - The base to use when converting bytes to a larger unit.
 * @param {Array<string>} [options.units=['B', 'KB', 'MB', 'GB', 'TB', 'PB']] - The units to use when converting bytes.
 *
 * @returns {string} A human-readable string representing the file size.
 */

export function formatFileSize(bytes, options = {}) {
    if (!Number.isFinite(bytes) || bytes < 0) return '0 B';

    const {
        decimals = 2,
        base = 1024,
        units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    } = options;

    let index = 0;
    let value = bytes;

    while (value >= base && index < units.length - 1) {
        value /= base;
        index++;
    }

    const fixed = value.toFixed(decimals);
    const clean = fixed.replace(/\.0+$|(\.\d*[1-9])0+$/, '$1');
    return `${clean} ${units[index]}`;
}


export function getFileUrl(fileId, access_token) {
    return `/api/files/${fileId}?access_token=${access_token}`
}

export function getThumbUrl(fileId, access_token) {
    return `/api/files/thumb/${fileId}?access_token=${access_token}`
}


export function formatFileIcon(row) {
    if (row.isFolder == 1) {
        return row.favoriteId ? 'FolderFavorite' : 'folder';
    }
    else {
        const ext = row.extension;
        const extMap = {
            // 文本类
            'txt': 'textFile',
            'md': 'textFile',
            'json': 'textFile',
            'xml': 'textFile',

            // 表格类
            'xls': 'spreadsheet',
            'xlsx': 'spreadsheet',
            'csv': 'spreadsheet',

            // 视频类
            'mp4': 'video',
            'mov': 'video',
            'avi': 'video',
            'mkv': 'video',

            // 图片类
            'jpg': 'image',
            'jpeg': 'image',
            'png': 'image',
            'gif': 'image',
            'svg': 'image',

            // 文档类
            'doc': 'word',
            'docx': 'word',
            'pdf': 'pdf',

            // 音频类
            'mp3': 'audio',
            'wav': 'audio',
            'flac': 'audio',

            // APK
            'apk': 'apk',

            // 压缩包
            'zip': 'archive',
            'rar': 'archive',
            '7z': 'archive',
            'tar': 'archive',
            'gz': 'archive',
        };

        return extMap[ext] || 'unknown'; // 没匹配到就返回 unknown
    }
}
