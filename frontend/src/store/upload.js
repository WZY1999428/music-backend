import { defineStore } from 'pinia'
import { useFileStore } from "./file";
import Uploader from '@/utils/upload';
import { status as UpS } from '@/utils/upload/task';

let initialized = false;
export const useUploadStore = defineStore('upload', () => {
    const uploadEngine = new Uploader();
    const uploadList = ref([]);
    const autoDeleteFinished = ref(false);
    const fileStore = useFileStore();
    const fileTotal = ref(0);
    const pageIndex = ref(1);
    const pageSize = ref(30);


    const handleBeforeUnload = (e) => {
        // 检查列表中是否还有正在上传或合并中的任务
        const isUploading = uploadList.value.some(file => [UpS.uploading, UpS.checking, UpS.hashing, UpS.mergeing].includes(file.status));
        // if (isUploading) {
        //     e.preventDefault();
        //     // 现代浏览器必须设置 returnValue 才会显示确认框
        //     e.returnValue = '文件正在上传，离开将导致上传中断，确定离开吗？';
        //     return e.returnValue;
        // }
    };

    function updatePageFiles(files) {
        fileTotal.value = files.length;
        pageIndex.value = Math.min(pageIndex.value, Math.ceil(fileTotal.value / pageSize.value));
        uploadList.value = files.slice((pageIndex.value - 1) * pageSize.value, pageIndex.value * pageSize.value);
    }

    function init() {
        if (initialized) return;
        uploadEngine.on('change', files => updatePageFiles(files));
        uploadEngine.on('completed', _ => {
            fileStore.forceRefresh(true);
        });
        window.addEventListener('beforeunload', handleBeforeUnload);
        initialized = true;
    }

    function openDialog(pid, isDir = true) {
        const file = document.createElement('input');
        file.type = 'file';
        if (isDir) file.webkitdirectory = true;
        file.click();
        file.onchange = () => {
            const files = file.files;
            if (files) {
                uploadEngine.addTasks(files, pid);
            }
        }
    }

    function clear() {
        uploadList.value = [];
        uploadEngine.clear();
    }
    return {
        uploadList,
        clear,
        init,
        autoDeleteFinished,
        pageIndex,
        pageSize,
        fileTotal,
        getList: () => updatePageFiles(uploadEngine.getUploadList()),
        remove: (id) => uploadEngine.remove(id),
        addDirs: (pid) => openDialog(pid, true),
        addFile: (pid) => openDialog(pid, false),
        retry: (id) => uploadEngine.retry(id),
        cancel: (id) => uploadEngine.cancel(id),
        resume: (id) => uploadEngine.resume(id),
        pause: (id) => uploadEngine.pause(id),
        resumeAll: () => uploadEngine.resumeAll(),
        pauseAll: () => uploadEngine.pauseAll(),
        removeAll: () => uploadEngine.removeAll(),
    }
})
