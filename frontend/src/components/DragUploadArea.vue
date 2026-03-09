<template>
    <div class="DragUploadArea" @dragover.prevent="onDragOver" @dragenter.prevent="onDragEnter"
        @dragleave.prevent="onDragLeave" @drop.prevent="onDrop" @click="onClick" :class="{ 'drag-over': isDragOver }">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
const isDragOver = ref(false)
// 拖拽高亮
function onDragOver(e: DragEvent) {
    e.preventDefault()
}

function onDragEnter(e: DragEvent) {
    e.preventDefault()
    isDragOver.value = true
}

function onDragLeave(e: DragEvent) {
    e.preventDefault()
    isDragOver.value = false
}

// 放下文件
function onDrop(e: DragEvent) {
    isDragOver.value = false
    const files = e.dataTransfer?.files
    if (files && files.length) {
        emitFiles(Array.from(files))
    }
}


// 选择文件
function onFileChange(e: Event) {
    const target = e.target as HTMLInputElement
    const files = target.files
    if (files && files.length) {
        emitFiles(Array.from(files))
        target.value = '' // 重置以便可以重复选择同一文件
    }
}

// 触发自定义事件
function emitFiles(files: File[]) {
    // 向父组件发出事件，方便上传处理
    const event = new CustomEvent('file-selected', { detail: files })
    // @ts-ignore
    // Vue 3 用 $emit 触发事件
    emit('file-selected', files)
}
</script>

<style lang="scss">
.DragUploadArea {
    width: 100%;
    height: 100%;
}

.DragUploadArea.drag-over {
    background-color: #e6f7ff;
    border-color: #1890ff;
}
</style>