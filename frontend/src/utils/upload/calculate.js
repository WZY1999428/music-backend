import { sha256 } from 'hash-wasm';

onmessage = async (e) => {
    const buffer = e.data.buffer; // 获取传入的文件
    const index = e.data.index;
    // 使用 Web Crypto API 计算 SHA-256 哈希 很快
    if (crypto && crypto.subtle && crypto.subtle.digest) {
        // if (false) {
        try {
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);  // 使用 Web Crypto API 计算 SHA-256 哈希
            const hashArray = Array.from(new Uint8Array(hashBuffer));  // 转换为字节数组
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');  // 转换为十六进制字符串
            postMessage({
                hash: hashHex,
                status: 'success',
                index
            });
        } catch (error) {
            console.error('Error with Web Crypto API:', error);
            postMessage({
                status: 'error',
                message: 'Error with Web Crypto API:' + error.message,
                index
            });
        }
    } else {
        // 使用 hash-wasm 计算 SHA-256 哈希 但是慢
        try {
            postMessage({
                hash: await sha256(new Uint8Array(buffer)),
                status: 'success',
                index
            });  // 返回哈希值
        } catch (error) {
            console.error('Error with hash-wasm:', error);
            postMessage({
                status: 'error',
                message: 'Error with hash-wasm:' + error.message,
                index
            });
        }
    }
};