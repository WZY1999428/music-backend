import Worker from './calculate.js?worker'
import EventEmitter from './event';
import { sha256 } from 'hash-wasm';
export default class WorkerTask {
    constructor() {
        this.maxWorkers = 6;
        this.workers = Array.from({ length: this.maxWorkers }, () => new Task());
    }


    addTask(chunks) {
        return new Promise((resolve, reject) => {
            const task = this.workers.find(worker => worker.status == "pending");
            if (task) {
                task.on("success", (hash) => resolve(hash));
                task.on("error", (e) => reject(e));
                task.run(chunks);
            } else {
                reject("waiting worker");
            }
        })
    }

}



class Task extends EventEmitter {
    constructor() {
        super();
        this.worker = new Worker();
        this.status = "pending";
    }

    run(chunks) {
        if (this.status != "pending") {
            this.emit("error", "waiting worker");
            return;
        };
        this.status = "running";
        let index = 0;
        const postMsg = async () => {
            const chunk = chunks[index];
            if (chunk) {
                const buffer = await chunk.blob.arrayBuffer();
                this.worker.postMessage({
                    buffer,
                    index: chunk.index
                }, [buffer])
            }
        }
        postMsg();
        this.worker.onmessage = async (e) => {
            const result = e.data;
            if (result.status == "success") {
                const chunk = chunks[index];
                chunk.hash = result.hash;
                index++;
                if (index < chunks.length) {
                    postMsg()
                } else {
                    sha256(chunks.map(chunk => chunk.hash).join('')).then(h => {
                        this.emit("success", h);
                    }).catch(e => {
                        this.emit("error", e);
                    })
                    this.status = "pending";
                }
            } else {
                this.status = "pending";
                this.emit("error", result.message);
            }
        }
        this.worker.onmessageerror = (e) => {
            this.emit("error", result.message);
        };
    }
}