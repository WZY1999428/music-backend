<template>
  <div class="file-list-view h-full" v-loading="fileStore.loading">
    <FileListView
      :files="fileStore.files"
      @dbclick="fileClick"
      @download="
        (e) => downloadFile(e.id, e.access_token, e.isFolder ? e.name + '.zip' : e.name)
      "
    ></FileListView>
    <!-- <fileIconView @dbclick="fileClick" :files="files""></fileIconView> -->
  </div>
</template>

<script setup>
import FileListView from "@/components/layout/FileListView.vue";
import fileIconView from "@/components/layout/FileIconView.vue";
import { download } from "@/request/files";
const fileStore = useFileStore();
fileStore.fetchFiles(0);
function fileClick(e) {
  if (e.isFolder) {
    fileStore.addPath(e.id, e.name);
  } else {
    downloadFile(e.id, e.access_token, e.name);
  }
}

async function downloadFile(fileId, access_token, filename) {
  window.open(getFileUrl(fileId, access_token));
  // try {
  //     const blob = await download(fileId, access_token);
  //     if (!(blob instanceof Blob)) {
  //         throw new TypeError("返回值不是 Blob");
  //     }
  //     const url = window.URL.createObjectURL(blob);
  //     const a = document.createElement('a');
  //     a.href = url;
  //     a.download = filename || 'download';
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);
  //     window.URL.revokeObjectURL(url);
  // } catch (error) {
  //     console.error(error);
  // }
}
</script>
