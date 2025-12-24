<template>
  <div class="px-1 flex items-center h-[40px]">
    <el-breadcrumb>
      <el-breadcrumb-item><span class="cursor-pointer select-none" @click="fileStore.resetPath()">{{
        fileStore.rootName }}</span></el-breadcrumb-item>
      <el-breadcrumb-item v-for="(item, index) in fileStore.breadcrumbs" :key="item.id">
        <el-tooltip class="box-item" effect="dark" :content="item.name" placement="top-start">
          <span class="cursor-pointer inline-block select-none max-w-[200px] truncate"
            @click="fileStore.removePath(index)" :title="item.name">{{ item.name }}</span>
        </el-tooltip>
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
  <div class="file-list-view rounded-sm shadow-md select-none p-3"
    style="background-color: var(--aside-bg-color); height: calc(100% - 40px)" v-loading="fileStore.loading">
    <FileListView :files="fileStore.files" @dbclick="fileClick" @download="(e) => downloadFile(e.id, e.access_token)"
      @delete="deleteFileFun" @recently="recentlyFilesFun"></FileListView>
    <!-- <fileIconView @dbclick="fileClick" :files="files""></fileIconView> -->
  </div>
</template>

<script setup>
import FileListView from "@/components/layout/FileListView.vue";
import fileIconView from "@/components/layout/FileIconView.vue";
import { recentlyFiles } from "@/request/trash"
import { deleteFile } from "@/request/files"
const fileStore = useFileStore();
fileStore.fetchFiles(0);
function fileClick(e) {
  if (e.isFolder) {
    fileStore.addPath(e.id, e.name);
  } else {
    downloadFile(e.id, e.access_token, e.name);
  }
}

const radio = ref("1")

function recentlyFilesFun(files) {
  ElMessageBox.confirm(
    '确定要恢复这些文件吗?',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      beforeClose: (action, instance, done) => {
        if (action === 'confirm') {
          instance.confirmButtonLoading = true
          instance.confirmButtonText = 'Loading...'
          recentlyFiles({
            fileIds: files.map(e => e.id)
          }).then(_res => {
            done()
            ElMessage({
              type: 'success',
              message: '恢复成功',
            })
            fileStore.forceRefresh();
          }).finally(() => {
            instance.confirmButtonLoading = false
            instance.confirmButtonText = '确定'
          })
        } else {
          done()
        }
      },
    },
  ).catch(() => { })
}

function deleteFileFun(files) {
  ElMessageBox({
    title: '警告',
    message: () => h(ElRadioGroup, {
      modelValue: radio.value,
      options: [
        { label: '永久删除', value: '0' },
        { label: '添加到回收站', value: '1' },
      ],
      onChange: (e) => radio.value = e
    }),
    beforeClose: (action, instance, done) => {
      if (action === 'confirm') {
        instance.confirmButtonLoading = true
        instance.confirmButtonText = 'Loading...'
        deleteFile({
          fileIds: files.map(e => e.id),
          status: radio.value
        }).then(_res => {
          instance.confirmButtonLoading = false
          instance.confirmButtonText = '确定'
          done()
          ElMessage({
            type: 'success',
            message: '删除成功',
          })
          fileStore.forceRefresh();
        })
      } else {
        done()
      }
    },
    showCancelButton: true,
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  }).catch(() => { })

}

async function downloadFile(fileId, access_token) {
  const a = document.createElement('a');
  a.href = getFileUrl(fileId, access_token);
  a.download = fileId;
  a.target = '_blank';
  a.click();
}
</script>
