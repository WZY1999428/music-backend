import Task from "./task";
import EventEmitter from "./event";

class Uploader  extends EventEmitter {
    constructor() {
        super();
        this.tasks = [];
        this.maxTasks = 5;
    }
}