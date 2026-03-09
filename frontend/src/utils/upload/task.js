import EventEmitter from "./event";
import { dayjs } from "element-plus";
import WorkerTask from "./workers";
import { sha256 } from 'hash-wasm';
const hashWorkers = new WorkerTask();
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
}), { autoCancel: false, showMessage: false });


const uploadRequest = createCancelableRequest((data) => ({
    url: "/upload",
    method: "post",
    data,
}), { showMessage: false });

const mergeRequest = createRequestWrapper((params) => ({
    url: "/upload/merge",
    method: "get",
    params,
}), { autoCancel: false, showMessage: false });


const cancelRequest = createRequestWrapper((params) => ({
    url: "/upload/cancel",
    method: "delete",
    params,
}), { autoCancel: false, showMessage: false });


export const status = {
    pending: "pending",
    slicing: "slicing",
    waitingHashing: "waitingHashing",
    hashing: "hashing",
    checking: "checking",
    uploading: "uploading",
    mergeing: "mergeing",
    completed: "completed",
    failed: "failed",
    cancel: "cancel",
    paused: "paused",
}

class Task extends EventEmitter {
    constructor(file, parentId, opt = defaultOptions) {
        super();
        this.id = Math.random().toString(36).slice(2);
        this.maxThread = opt.maxThread || defaultOptions.maxThread;
        this.chunkSize = opt.chunkSize || defaultOptions.chunkSize;
        this.retryCount = opt.retry || defaultOptions.retry;
        this.parentId = parentId;
        this.uploadTasks = new Map();
        this.uploadFinisheds = new Set();;
        this.uploadDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
        this.file = file;
        this.error = null;
        this.hash = null;
        this.status = status.pending;
        this.lastStatus = null;
        this.chunks = [];
    }

    #emitCanceled() {
        this.status = status.cancel
        this.error = "任务已被取消";
        this.emit("cancel", this);
    }

    #emitError(e) {
        this.status = status.failed
        this.error = e;
        this.emit("error", e, this);
        this.#emitChange();
    }

    #emitSuccess() {
        this.status = status.completed
        this.emit("completed", this);
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

    #pusedAndCancel() {
        return [status.paused, status.cancel].includes(this.status);
    }

    start() {
        if (![status.pending, status.waitingHashing, status.failed].includes(this.status)) {
            return;
        }
        if (this.chunks.length && this.hash) {
            this.check();
        } else {
            this.chunks = [];
            this.slice();
        }
    }

    slice() {
        if (this.chunks.length) {
            this.check();
            this.#emitChange();
            return;
        }
        if (this.#pusedAndCancel() || status.slicing == this.status) return;
        const chunks = [];
        let start = 0;
        let end = 0;
        this.status = status.slicing
        this.#emitChange();
        while (end < this.file.size) {
            if (this.#pusedAndCancel()) {
                this.chunks = [];
                break;
            };
            end = Math.min(start + this.chunkSize, this.file.size);
            chunks.push({
                blob: this.file.slice(start, end, this.file.type),
                index: chunks.length,
                hash: null
            });
            start = end;
        }
        if (this.#pusedAndCancel()) return;
        this.chunks = chunks;
        this.startComputeHash();

    }

    startComputeHash() {
        if (this.#pusedAndCancel() || status.hashing == this.status) return;
        this.status = status.hashing;
        this.#computeHash().then(hash => {
            if (this.status == status.hashing) {
                this.hash = hash;
                this.check();
                this.#emitChange();
            }
        }).catch(e => {
            if (e == "waiting worker") {
                this.status = status.waitingHashing;
            } else {
                if (e !== "hashing") this.#emitError("slice error:" + e.message);
            }
        })
    }


    #computeHash() {
        return new Promise((resolve, reject) => {
            const chunks = [...this.chunks];
            if (chunks.length == 0) {
                sha256(`${this.file.webkitRelativePath || this.file.name}${this.file.size}`).then(hash => {
                    resolve(hash);
                }).catch(e => reject(e));
            } else {
                hashWorkers.addTask(chunks).then(hash => {
                    resolve(hash);
                }).catch(e => reject(e));
            }
            this.#emitChange();

        })
    }



    check() {
        if (this.#pusedAndCancel() || status.checking == this.status) return;
        this.status = status.checking
        this.#emitChange();
        checkRequest({ hash: this.hash, parentId: this.parentId, filename: this.file.name, relativePath: this.file.webkitRelativePath }).then(res => {
            const data = res.data;
            this.uploadFinisheds = new Set(this.chunks)
            if (data.exists) {
                this.#emitSuccess();
            } else {
                const files = data.files;
                if (files.length >= this.chunks.length) {
                    this.merge();
                } else {
                    this.uploadFinisheds = new Set(files.filter(file => this.chunks.some(f => f.hash == file.chunkHash)));
                    this.upload();
                }
            }
        }).catch(e => {
            if (!e.__CANCELED__) this.#emitError("check error:" + e.message);
        })
    }

    merge() {
        if (this.#pusedAndCancel() || status.mergeing == this.status) return;
        this.status = status.mergeing;
        mergeRequest({ hash: this.hash }).then(res => {
            this.#emitSuccess();
        }).catch(e => {
            if (!e.__CANCELED__) this.#emitError("merge error:" + e.message);
            else this.#emitCanceled();
        })
    }


    async upload() {
        if (this.#pusedAndCancel() || status.uploading == this.status) return;
        const files = this.chunks.filter(chunk => !this.uploadFinisheds.has(chunk.hash));
        let canceld = false;
        this.status = status.uploading;
        this.#emitChange();
        const worker = async () => {
            while (files.length && !canceld && this.status == status.uploading) {
                if (this.#pusedAndCancel()) break;
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
        let retry = this.retryCount;
        while (retry > 0) {
            try {
                if (this.#pusedAndCancel()) return 1;
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
                    this.#emitError("upload error:" + err.message);
                    return 2;
                }
            }
        }
    }



    resume() {
        if (this.status == status.paused) {
            this.status = status.pending;
            switch (this.lastStatus) {
                case status.pending:
                    this.start();
                    break;
                case status.checking:
                    this.check();
                    break;
                case status.mergeing:
                    this.merge();
                    break;
                case status.uploading:
                    this.upload();
                    break;
                case status.slicing:
                    this.slice();
                    break;
                default:
                    if ([status.hashing, status.waitingHashing].includes(this.lastStatus)) this.startComputeHash();
                    break;
            }
        }
    }


    pause() {
        this.uploadTasks.forEach(o => o.cancel());
        this.uploadTasks.clear();
        this.lastStatus = this.status;
        this.status = status.paused;
        this.emit("pause", this);
        this.#emitChange();
    }

    cancel(t) {
        this.status = status.cancel
        this.uploadTasks.forEach(o => o.cancel());
        this.chunks = [];
        this.uploadFinisheds.clear();
        this.uploadTasks.clear();
        t && this.#emitCancel();
        if (this.hash) cancelRequest({ hash: this.hash });
    }

    retry() {
        this.start();
    }

}


export default Task
