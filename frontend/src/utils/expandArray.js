Object.defineProperty(Array.prototype, 'insertAt', {
    value: function (index, ...items) {
        if (!Array.isArray(this)) throw new TypeError('insertAt must be called on an array')
        if (typeof index !== 'number') throw new TypeError('index must be a number')
        if (index < 0) index = 0
        if (index > this.length) index = this.length
        this.splice(index, 0, ...items)
    },
    writable: true,
    configurable: true,
    enumerable: false 
})