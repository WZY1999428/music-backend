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
}), { autoCancel: false });


const uploadRequest = createCancelableRequest((data) => ({
    url: "/upload",
    method: "post",
    data,
}));

const mergeRequest = createRequestWrapper((params) => ({
    url: "/upload/merge",
    method: "get",
    params,
}), { autoCancel: false });


const cancelRequest = createRequestWrapper((params) => ({
    url: "/upload/cancel",
    method: "delete",
    params,
}), { autoCancel: false });


export const status = {
    "pending": 0,
    "slicing": 1,
    "hashing": 2,
    "checking": 3,
    "uploading": 4,
    "mergeing": 5,
    "success": 6,
    "fail": 7,
    "cancel": 8,
    "paused": 9
}

class Task extends EventEmitter {
    constructor(file, parentId, opt = defaultOptions) {
        super();
        this.id = Math.random().toString(36).slice(2);
        this.maxThread = opt.maxThread || defaultOptions.maxThread;
        this.chunkSize = opt.chunkSize || defaultOptions.chunkSize;
        this.retry = opt.retry || defaultOptions.retry;
        this.parentId = parentId;
        this.uploadTasks = new Map();
        this.uploadFinisheds = new Set();;
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
        this.emit("error", e, this);
        this.#emitChange();
    }

    #emitSuccess() {
        this.status = status.success
        this.emit("success", this);
        this.#emitChange();
    }

    #emitChange() {
        this.emit("change");
    }

    #emitCancel() {
        this.status = status.cancel
        this.emit("cancel", this);
        this.#emitChange();
    }


    start() {
        if (![status.pending, status.cancel, status.fail].includes(this.status)) {
            return;
        }
        this.status = status.slicing
        if (this.chunks.length) {
            this.check();
        } else {
            this.slice();
        }
    }

    async slice() {
        if (this.chunks.length) {
            this.check();
            this.#emitChange();
            return;
        }
        const chunks = [];
        let start = 0;
        let end = 0;
        this.status = status.slicing
        this.#emitChange();
        while (end < this.file.size) {
            end = Math.min(start + this.chunkSize, this.file.size);
            chunks.push({
                blob: this.file.slice(start, end, this.file.type),
                index: chunks.length,
                hash: null
            });
            start = end;
        }
        this.chunks = chunks;
        this.crateHash().then(hash => {
            this.hash = hash;
            this.check();
            this.#emitChange();
        }).catch(e => {
            if (e !== "hashing") this.#emitError(e);
        })
    }


    check() {
        this.status = status.checking
        this.#emitChange();
        checkRequest({ hash: this.hash, parentId: this.parentId, filename: this.file.name }).then(res => {
            const data = res.data;
            if (data.exists) {
                this.#emitSuccess();
            } else {
                const files = data.files;
                if (files.length >= this.chunks.length) {
                    this.merge();
                } else {
                    const uploaded = new Set();
                    for (const file of files) {
                        const f = this.chunks.find(f => f.hash == file.chunkHash);
                        if (f) uploaded.add(f);
                    }
                    this.uploadFinisheds = uploaded;
                    this.upload();
                }
            }
        }).catch(e => {
            if (!e.__CANCELED__) this.#emitError(e);
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
        const files = this.chunks.filter(chunk => !this.uploadFinisheds.has(chunk.hash));
        let canceld = false;
        this.status = status.uploading;
        this.#emitChange();
        const worker = async () => {
            while (files.length && !canceld && this.status == status.uploading) {
                const file = files.shift();
                const ret = await this.#uploadChunk(file);
                this.#emitChange();
                if (ret !== 0 && !canceld) {
                    if (ret === 1 && this.status != status.paused) this.#emitCancel();
                    canceld = true;
                    this.uploadTasks.forEach(o => o.cancel());
                    this.uploadTasks.clear();
                    break;
                };
            }
        };
        const workers = Array.from({ length: this.maxThread }, () => worker());
        await Promise.all(workers);
        if (!files.length && !canceld) {
            this.merge();
        }
    }

    // 将 chunk 上传逻辑单独封装
    async #uploadChunk(file) {
        let retry = this.retry;
        while (retry > 0) {
            try {
                const formData = new FormData();
                formData.append("file", file.blob, file.type);
                formData.append("hash", this.hash);
                formData.append("index", file.index);
                formData.append("savePath", this.savePath);
                formData.append("chunkHash", file.hash);
                formData.append("filename", this.file.name);
                formData.append("relativePath", this.file.webkitRelativePath);
                const { request, cancel } = uploadRequest(formData);
                this.uploadTasks.set(file.hash, { cancel });
                await request;
                this.uploadTasks.delete(file.hash);
                this.uploadFinisheds.add(file);
                return 0;
            } catch (err) {
                if (err.__CANCELED__) return 1;
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
            if (this.status == status.hashing) return reject("hashing");
            const worker = new Worker();
            const chunks = this.chunks;
            this.status = status.hashing;
            this.#emitChange();
            let index = 0;
            const cleanup = () => {
                worker.terminate();
            };
            const postMsg = async () => {
                const chunk = chunks[index];
                const buffer = await chunk.blob.arrayBuffer();
                worker.postMessage({
                    buffer,
                    index: chunk.index
                }, [buffer])
            }
            postMsg();
            worker.onmessage = async (e) => {
                const result = e.data;
                if (this.status == 'cancel') {
                    this.chunks = [];
                    cleanup();
                } else {
                    if (result.status == "success") {
                        const chunk = chunks[index];
                        chunk.hash = result.hash;
                        index++;
                        if (index < chunks.length) {
                            postMsg()
                        } else {
                            sha256(chunks.map(chunk => chunk.hash).join('')).then(h => resolve(h)).catch(e => reject(e))
                            cleanup();
                        }
                    } else {
                        cleanup();
                        reject(result.message)
                    }
                }
            }
            worker.onmessageerror = (e) => {
                cleanup();
                reject(e)
            };

        })
    }


    restore() {
        if (this.status == status.paused) {
            this.start();
        }
    }


    pause() {
        this.uploadTasks.forEach(o => o.cancel());
        this.uploadTasks.clear();
        this.status = status.paused;
        this.emit("pause", this);
        this.#emitChange();
    }

    cancel() {
        this.status = status.cancel
        this.uploadTasks.forEach(o => o.cancel());
        this.uploadTasks.clear();
        this.#emitCancel();
        if (this.hash) cancelRequest({ hash: this.hash });
    }

    retry() {
        this.start();
    }

}


export default Task
