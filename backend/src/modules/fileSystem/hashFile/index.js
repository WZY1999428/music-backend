const { Worker } = require('node:worker_threads');
const path = require('path');
class HashFile {
    constructor(maxWorkers = 4) {
        this.workerPath = path.join(__dirname, 'hashFileWorker.js');
        this.maxWorkers = maxWorkers;
        this.workers = new Map(); // workerId -> WorkerTask
        this.pendingTasks = []; // 队列任务 {filePath, resolve, reject}
        this.workerCounter = 0;
    }
    getIdleWorker() {
        for (const worker of this.workers.values()) {
            if (worker.idle) return worker;
        }
        return null;
    }

    createWorker() {
        const id = this.workerCounter++;
        const workerTask = new WorkerTask(this.workerPath, (worker) => this.assignPending(worker));
        this.workers.set(id, workerTask);
        return workerTask;
    }

    assignPending(worker) {
        // 有待分配任务就给空闲 Worker
        if (this.pendingTasks.length === 0) return;
        const task = this.pendingTasks.shift();
        worker.setTask(task.record).then(() => task.resolve(task.record)).catch(task.reject);
    }
    clear() {
        for (const worker of this.workers.values()) worker.destroy();
        this.workers.clear();
        this.pendingTasks = [];

    }
    addTask(record) {
        // 找空闲 Worker
        let worker = this.getIdleWorker();
        if (!worker) {
            if (this.workers.size < this.maxWorkers) {
                worker = this.createWorker();
            }
        }
        if (worker) {
            return worker.setTask(record);
        } else {
            // 都忙，放入队列
            return new Promise((resolve, reject) => {
                this.pendingTasks.push({ record, resolve, reject });
            });
        }
    }
}

class WorkerTask {
    constructor(workerPath, onIdleCallback) {
        this.worker = new Worker(workerPath);
        this.task = null;
        this.closeTimer = null;
        this.onIdleCallback = onIdleCallback; // 通知父类空闲
        this.worker.on('message', (msg) => this.handleMessage(msg));
        this.worker.on('error', (err) => this.handleError(err));
    }

    handleMessage({ code, data }) {
        const task = this.task;
        task.record.hash = data;
        this.task = null;
        code === 'success' ? task.resolve(task.record) : task.reject(data);
        this.onIdleCallback(this);
        this.checkClose();
    }

    handleError(err) {
        this.task?.reject(err);
        this.worker.terminate();
        this.task = null;
    }

    setTask(record) {
        return new Promise((resolve, reject) => {
            this.task = { resolve, reject, record }
            clearTimeout(this.closeTimer);
            this.worker.postMessage({ filePath: record.filePath });
        });
    }

    checkClose() {
        clearTimeout(this.closeTimer);
        this.closeTimer = setTimeout(() => {
            if (!this.task) {
                console.log("线程关闭了");
                this.worker.terminate();
                this.worker = null;
            }
        }, 1000 * 60 * 20); // 空闲 20 分钟自动关闭
    }
    destroy() {
        clearTimeout(this.closeTimer);
        if (this.task) this.task.reject('destroy');
        this.task = null;
        this.closeTimer = null
        this.worker.terminate();
        this.worker = null;
    }


    get idle() {
        return this.task === null;
    }
}

module.exports = HashFile;
