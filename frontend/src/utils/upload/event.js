class EventEmitter {
    constructor() {
        // 存储事件名和对应的监听器
        this.events = {};
    }

    // 订阅事件
    on(eventName, listener) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];  // 初始化事件列表
        }
        this.events[eventName].push(listener);  // 添加监听器到事件列表
    }

    // 触发事件
    emit(eventName, ...args) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(listener => {
                listener(...args);  // 执行每个监听器，传入参数
            });
        }
    }

    // 移除事件的监听器
    removeListener(eventName, listener) {
        if (this.events[eventName]) {
            const index = this.events[eventName].indexOf(listener);
            if (index !== -1) {
                this.events[eventName].splice(index, 1);  // 移除监听器
            }
        }
    }

    // 监听一次事件（事件触发一次后移除监听器）
    once(eventName, listener) {
        const onceWrapper = (...args) => {
            listener(...args);
            this.removeListener(eventName, onceWrapper);  // 触发一次后移除监听器
        };
        this.on(eventName, onceWrapper);  // 添加一次性监听器
    }
}

export default EventEmitter;