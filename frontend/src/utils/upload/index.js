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
        for (const file of files) {
            this.addTask(file, parentId);
        }
    }

    addTask(file, parentId) {
        const task = new Task(file, parentId);
        task.on('change', () => {
            this.#emitChange();
        });

        function dleteOnly(task) {
            this.runningTasks.delete(task.id);
            this.#run();
        }
        task.on('success', (task) => {
            this.#emitSuccess();
            dleteOnly.call(this, task);
        });
        task.on('pause', (task) => {
            this.#emitChange();
            dleteOnly.call(this, task);
        });
        task.on('error', (e, task) => {
            console.log(e);
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
        if (this.runningTasks.size >= this.maxThread) return;
        let nextCount = this.maxThread - this.runningTasks.size;
        const tasks = Array.from(this.tasks.values()).filter(v => v.status == status.pending);
        if (nextCount > tasks.length) nextCount = tasks.length;
        for (let i = 0; i < nextCount; i++) {
            const task = tasks.shift();
            if (task) {
                this.runningTasks.set(task.id, task);
                task.start();
            }
        }
    }


    pause(id) {
        this._withTask(id, task => task.pause());
    }

    retry(id) {
        this._withTask(id, task => task.retry());
    }

    cancel(id) {
        this._withTask(id, task => task.cancel());
    }

    resume(id) {
        this._withTask(id, task => task.restore());
    }

    clear() {
        this.tasks.forEach(o => o.cancel());
        this.tasks.clear();
        this.runningTasks.clear();
    }


    #emitError(e) {
        this.emit("error", e);
        this.#emitChange();
    }

    #emitSuccess() {
        this.emit("success");
        this.#emitChange();
    }

    #changeTimer = 0;
    #debounceTimeout = null;
    #emitChange() {
        const now = Date.now();
        clearTimeout(this.#debounceTimeout);
        if (now - this.#changeTimer >= 300) {
            this.emit("change", Array.from(this.tasks.values()));
            this.#changeTimer = now;
        }
        // 确保最后一次可能小于300也会执行
        this.#debounceTimeout = setTimeout(() => this.emit("change", Array.from(this.tasks.values())), 300);
    }

    #emitCancel(task) {
        this.emit("cancel", task);
        this.#emitChange();
    }

}

export default Uploader;