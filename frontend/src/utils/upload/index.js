import Task, { status } from "./task";
import EventEmitter from "./event";

class Uploader extends EventEmitter {
    constructor() {
        super();
        this.maxThread = 5;
        this.tasks = new Map();
        this.runningTasks = new Map();
    }

    _withTask(id, action) {
        const task = this.tasks.get(id);
        if (!task) {
            console.warn(`任务 ${id} 不存在`);
            return;
        }
        action(task);
    }

    addTasks(files, parentId) {
        files = Array.from(files);
        function next() {
            for (let i = 0; i < 100; i++) {
                const f = files.shift()
                if (f && f.name) this.addTask(f, parentId);
            }
            if (files.length) {
                setTimeout(next.bind(this), 500);
            }
        }
        next.call(this);
    }
    #runTimer = 0;
    #runDebounceTimeout = null;
    addTask(file, parentId) {
        const task = new Task(file, parentId);
        const dleteOnly = (task) => {
            const now = Date.now();
            clearTimeout(this.#runDebounceTimeout);
            this.runningTasks.delete(task.id);
            if (task.status == status.completed) this.tasks.delete(task.id);
            if (now - this.#runTimer >= 200) {
                this.#runTimer = now;
                this.#run();
            }
            this.#runDebounceTimeout = setTimeout(() => this.#run(), 400);
        }
        task.on('completed', (task) => {
            this.#emitSuccess(task);
            dleteOnly.call(this, task);
        });
        task.on('pause', (task) => {
            this.#emitChange();
            dleteOnly.call(this, task);
        });
        task.on('error', (e, task) => {
            this.#emitError(e);
            dleteOnly.call(this, task);
        });
        task.on('cancel', (task) => {
            this.#emitCancel(task);
            dleteOnly.call(this, task);
        });
        this.tasks.set(task.id, task);
        this.#run();
    }

    #run() {
        const filter = [status.waitingHashing, status.pending];
        const queue = Array.from(this.tasks.values()).filter(f => filter.includes(f.status));
        let nextCount = this.maxThread - this.runningTasks.size;
        if (!queue.length) return;
        for (let i = 0; i <= nextCount; i++) {
            const task = queue.shift();
            if (task && this.runningTasks.has(task.id)) {
                i--;
                continue;
            } else if (task) {
                this.runningTasks.set(task.id, task);
                task.start()
            } else {
                break;
            }
        }
    }


    pause(id) {
        this._withTask(id, task => task.pause());
    }

    retry(id) {
        this._withTask(id, task => task.retry());
    }

    pauseAll() {
        this.tasks.forEach(o => {
            if ([status.checking, status.pending, status.hashing, status.mergeing, status.uploading, status.waitingHashing].includes(o.status)) o.pause();
        });
        this.runningTasks.clear();
    }

    resumeAll() {
        this.tasks.forEach(o => {
            if ([status.paused, status.failed].includes(o.status)) {
                o.status = status.pending;
            }
        });
        this.#run();
    }

    getUploadList() {
        return this.#formatFiles();
    }

    cancel(id) {
        this._withTask(id, task => task.cancel(true));
    }

    remove(id) {
        this._withTask(id, task => {
            task.cancel(false);
            this.tasks.delete(task.id);
            this.#emitChange();
        });
    }

    removeAll() {
        this.tasks.forEach(o => o.cancel(false));
        this.runningTasks.clear();
        this.tasks.clear();
        this.#emitChange();
    }


    resume(id) {
        this._withTask(id, task => {
            if (this.runningTasks.size >= this.maxThread) {
                task.status = pending;
            } else {
                task.resume()
            }
        });
    }

    clear() {
        this.tasks.forEach(o => o.cancel());
        this.tasks.clear();
    }


    #emitError(e) {
        this.emit("error", e);
        this.#emitChange();
    }

    #emitSuccess(task) {
        this.emit("completed", task);
        this.#emitChange();
    }

    #changeTimer = 0;
    #debounceTimeout = null;
    #emitChange() {
        const now = Date.now();
        clearTimeout(this.#debounceTimeout);
        if (now - this.#changeTimer >= 300) {
            this.emit("change", this.#formatFiles());
            this.#changeTimer = now;
        }
        this.#debounceTimeout = setTimeout(() => this.emit("change", this.#formatFiles()), 300);
    }

    #formatFiles() {
        const list = Array.from(this.tasks.values());
        return list.map(item => {
            const uploadFinisheds = Array.from(item.uploadFinisheds);
            const progress = item.uploadFinisheds.size / item.chunks.length;
            return {
                id: item.id,
                status: item.status,
                error: item.error,
                filename: item.file?.webkitRelativePath ?? item.file?.name,
                progress: isFinite(progress) ? progress * 100 : 0,
                size: item.file?.size,
                uploadedSize: uploadFinisheds.reduce((a, b) => a + (b.blob?.size || 0), 0),
                uploadDate: item.uploadDate
            }
        })
    }

    #emitCancel(task) {
        this.emit("cancel", task);
        this.#emitChange();
    }

}

export default Uploader;