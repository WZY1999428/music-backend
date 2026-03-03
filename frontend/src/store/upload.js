import { defineStore } from 'pinia'
import Uploader from '@/utils/upload';
let initialized = false;
export const useUploadStore = defineStore('upload', () => {
    const uploadEngine = new Uploader();
    const uploadList = ref([]);

    function init() {
        if (initialized) return;
        uploadEngine.on('change', files => {
            uploadList.value = files;
        });
        initialized = true;
    }
    function addFile(pid) {
        openDialog(pid, false);
    }


    function addDirs(pid) {
        openDialog(pid, true);
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



    function pause(id) {
        uploadEngine.pause(id);
    }

    function resume(id) {
        uploadEngine.resume(id);
    }

    function retry(id) {
        uploadEngine.retry(id);
    }

    function cancel(id) {
        uploadEngine.cancel(id);
    }

    function clear() {
        uploadList.value = [];
        uploadEngine.clear();
    }

    return { uploadList, addFile, addDirs, pause, resume, retry, cancel, clear, init }
})
