import EventEmitter from "./event";
import { sha256 } from 'hash-wasm';
import Worker from './calculate.js?worker'
import createRequestWrapper from "@/request";
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


const uploadRequest = createRequestWrapper((data) => ({
    url: "/upload",
    method: "post",
    data,
}), { autoCancel: false });

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
    "success": 4,
    "fail": 5,
    "cancel": 6
}

class Task extends EventEmitter {
    constructor(file, savePath, opt = defaultOptions) {
        super();
        this.maxThread = opt.maxThread || defaultOptions.maxThread;
        this.chunkSize = opt.chunkSize || defaultOptions.chunkSize;
        this.retry = opt.retry || defaultOptions.retry;
        this.savePath = savePath;
        this.file = file;
        this.error = null;
        this.hash = null;
        this.status = status.pending;
        this.chunks = [];
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
            this.upload();
            this.#emitChange();
        }).catch(e => {
            this.#emitError(e);
        })
    }


    check() {
        this.status = status.checking
        checkRequest({ hash: this.hash, savePath: this.savePath }).then(res => {

        }).catch(e => {
            this.#emitError(e);
        })
    }

    mergeRequest() {
        this.status = status.mergeing;
        mergeRequest({ hash: this.hash, savePath: this.savePath }).then(res => {

        }).catch(e => {
            this.#emitError(e);
        })
    }


    async upload() {
        const files = this.chunks.slice(0);
        const _this = this;
        const file = files.shift();
        start(file, (status) => {

        });
        async function start(file, cb) {
            let retryCount = _this.retry;
            while (retryCount >= 0) {
                try {
                    const formData = new FormData();
                    formData.append("file", file.blob, file.type);
                    formData.append("hash", _this.hash);
                    formData.append("index", file.index);
                    formData.append("savePath", _this.savePath);
                    formData.append("chunkHash", file.hash);
                    await uploadRequest(formData);
                    cb(true);
                    break;
                } catch (error) {
                    retryCount--;
                    if (retryCount < 0) {
                        cb(false);
                        _this.#emitError(error);
                    }
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