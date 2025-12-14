function formatSize(bytes, options = {}) {
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

export { formatSize }