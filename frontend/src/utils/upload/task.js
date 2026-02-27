import EventEmitter from "./event";
import { sha256 } from 'hash-wasm';
import Worker from './calculate.js?worker'
import createRequestWrapper, { createCancelableRequest } from "@/request";
const defaultOptions = {
    maxThread: 5,
    chunkSize: 1024 ** 2 * 2,
    retry: 3,
}


const checkRequest = createRequestWrapper((params) => ({
    url: "/upload/check",
    method: "get",
    params,
}));


const uploadRequest = createCancelableRequest((data) => ({
    url: "/upload",
    method: "post",
    data,
}));

const mergeRequest = createRequestWrapper((params) => ({
    url: "/upload/merge",
    method: "get",
    params,
}));


const status = {
    "pending": 0,
    "slicing": 1,
    "hashing": 2,
    "checking": 3,
    "uploading": 4,
    "mergeing": 5,
    "success": 6,
    "fail": 7,
    "cancel": 8
}

class Task extends EventEmitter {
    constructor(file, parentId, opt = defaultOptions) {
        super();
        this.maxThread = opt.maxThread || defaultOptions.maxThread;
        this.chunkSize = opt.chunkSize || defaultOptions.chunkSize;
        this.retry = opt.retry || defaultOptions.retry;
        this.parentId = parentId;
        this.uploadTasks = new Map();
        this.uploadFinisheds = [];
        this.file = file;
        this.error = null;
        this.hash = null;
        this.status = status.pending;
        this.chunks = [];
    }

    #emitCanceled() {
        this.status = status.cancel
        this.error = "任务已被取消";
        this.emit("cancel");
    }

    #emitError(e) {
        this.status = status.fail
        this.error = e;
        this.emit("error", e);
    }

    #emitSuccess() {
        this.status = status.success
        this.emit("success");
    }

    #emitChange() {
        this.emit("change");
    }


    start() {

    }


    async slice() {
        const chunks = [];
        let start = 0;
        let end = 0;
        let index = 0;
        this.status = status.slicing
        while (end < this.file.size) {
            end = Math.min(start + this.chunkSize, this.file.size);
            chunks.push({
                blob: this.file.slice(start, end, this.file.type),
                index,
                hash: null
            });
            start = end;
            index++
        }
        this.chunks = chunks;
        this.status = status.hashing
        this.crateHash().then(hash => {
            this.hash = hash;
            this.check();
            this.#emitChange();
        }).catch(e => {
            this.#emitError(e);
        })
    }


    check() {
        this.status = status.checking
        checkRequest({ hash: this.hash, parentId: this.parentId, filename: this.file.name }).then(res => {
            const data = res.data;
            if (data.exists) {
                this.#emitSuccess();
            } else {
                const files = data.files;
                if (files.length >= this.chunks.length) {
                    this.merge();
                } else {
                    const uploaded = [];
                    for (file of files) {
                        const f = this.chunks.find(f => f.hash == file.chunkHash);
                        if (f) uploaded.push(f);
                    }
                    this.uploadFinisheds = uploaded;
                    this.upload();
                }
            }
        }).catch(e => {
            if (e != __CANCELED__) this.#emitError(e);
            else this.#emitCanceled();
        })
    }

    merge() {
        this.status = status.mergeing;
        mergeRequest({ hash: this.hash }).then(res => {
            this.#emitSuccess();
        }).catch(e => {
            if (!e.__CANCELED__) this.#emitError(e);
            else this.#emitCanceled();
        })
    }


    async upload() {
        // 1. 过滤已上传的分片
        const files = this.chunks.filter(chunk => !this.uploadFinisheds.some(f => f.hash === chunk.hash));
        if (files.length === 0) return this.merge();
        const limit = this.maxThread;
        let isErrorOrCanceled = false;
        const executor = async () => {
            while (files.length > 0 && !isErrorOrCanceled) {
                const file = files.shift(); // 从任务池取出一个
                if (!file) break;
                try {
                    // 如果 #uploadChunk 返回 1, 说明被取消 2 说明出错
                    const ret = await this.#uploadChunk(file);
                    if (ret > 0 && !isErrorOrCanceled) {
                        isErrorOrCanceled = ret === 1;
                        if (isErrorOrCanceled) this.#emitCanceled();
                        this.uploadTasks.forEach((task) => task.cancel());
                        this.uploadTasks.clear();
                    }
                } catch (err) {
                    isErrorOrCanceled = true;
                }
            }
        };

        // 3. 同时启动 limit 个任务
        const workers = Array.from({ length: limit }, () => executor());
        // 4. 等待所有任务上传完成
        await Promise.all(workers);
        // 5. 检查是否全部完成
        if (!isErrorOrCanceled && this.uploadFinisheds.length === this.chunks.length) {
            this.merge();
        }
    }

    // 将 chunk 上传逻辑单独封装
    async #uploadChunk(file) {
        let retry = this.retry;
        while (retry >= 0) {
            try {
                const formData = new FormData();
                formData.append("file", file.blob, file.type);
                formData.append("hash", this.hash);
                formData.append("index", file.index);
                formData.append("savePath", this.savePath);
                formData.append("chunkHash", file.hash);
                formData.append("filename", this.file.name);
                const { request, cancel } = uploadRequest(formData);
                this.uploadTasks.set(file.hash, { cancel });
                await request;
                this.uploadTasks.delete(file.hash);
                this.uploadFinisheds.push(file);
                return 0;
            } catch (err) {
                this.uploadTasks.delete(file.hash);
                if (err.__CANCELED__) {
                    return 1;
                }
                retry--;
                if (retry <= 0) {
                    this.#emitError(err);
                    return 2;
                }
            }
        }
    }

    crateHash() {
        return new Promise((resolve, reject) => {
            const worker = new Worker();
            const chunks = this.chunks;
            let index = 0;
            postMsg();
            worker.onmessage = async (e) => {
                const result = e.data;
                if (result.status == "success") {
                    const chunk = chunks[index];
                    chunk.hash = result.hash;
                    index++;
                    index < chunks.length ? postMsg() : sha256(chunks.map(chunk => chunk.hash).join('')).then(h => resolve(h)).catch(e => reject(e))
                } else {
                    console.error(result);
                    reject(result.message)
                }
            }
            async function postMsg() {
                const chunk = chunks[index];
                const buffer = await chunk.blob.arrayBuffer();
                worker.postMessage({
                    buffer,
                    index: chunk.index
                }, [buffer])
            }
        })
    }


    restore() {

    }


    pause() {

    }

    cancel() {

    }

    retry() {

    }

}


export default Task