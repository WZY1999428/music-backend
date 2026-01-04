<template>
  <div class="px-1 flex items-center justify-between h-[40px]" @mouseup="onMouseup">
    <div class="flex-1">
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
    <div class="w-[120px] flex items-center justify-end">
      <el-button type="primary" @click="handleCreateFolder">创建文件夹</el-button>
      <el-button :disabled="!selectFiles.length" type="danger" @click="deleteFileFun(selectFiles)">批量删除</el-button>
    </div>
  </div>
  <div class="file-list-view rounded-sm shadow-md select-none p-3" @mouseup="onMouseup"
    :element-loading-svg="loadingSvg" v-loading="fileStore.loading" :element-loading-text="loadingText"
    element-loading-svg-view-box="0 0 400 120" element-loading-custom-class="no-rotate-loading"
    @contextmenu="(event) => handleRowContextMenu({ event, file: null })"
    style="background-color: var(--aside-bg-color); height: calc(100% - 40px)">
    <FileListView :files="fileStore.files" @dbclick="fileClick" @download="(e) => downloadFile(e.id, e.access_token)"
      @delete="deleteFileFun" @recently="recentlyFilesFun" @tableSelectionChange="handleTableSelectionChange"
      @row-contextmenu="handleRowContextMenu">
    </FileListView>
  </div>
</template>

<script setup>
import FileListView from "@/components/layout/FileListView.vue";
import fileIconView from "@/components/layout/FileIconView.vue";
import { recentlyFiles } from "@/request/trash"
import { deleteFile, syncFile, createFolder, copyFile } from "@/request/files"
import cpSvg from "@/assets/svg/cp.svg?raw"
const fileStore = useFileStore();
const loadingSvg = ref(cpSvg)
const loadingText = ref('加载中...')
fileStore.fetchFiles(0);
const selectFiles = reactive([])
function fileClick(e) {
  if (e.isFolder) {
    fileStore.addPath(e.id, e.name);
  } else {
    downloadFile(e.id, e.access_token, e.name);
  }
}
watch(() => fileStore.files.length, () => {
  loadingText.value = '加载中...'
})

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

function onMouseup(e) {
  if (e.button == 3) {
    fileStore.backPath();
    e.preventDefault()
  }
}
const temFile = [];
function handleRowContextMenu({ event, file }) {
  let items = [];
  if (file) {
    items = [
      { label: '刷新', action: () => fileStore.forceRefresh() },
      { label: '复制', action: (file) => temFile.splice(0, temFile.length, file) },
      { label: '移动', action: (file) => downloadFile(file.id, file.access_token) },
      { label: '删除', action: (file) => deleteFileFun([file]) },
      { label: '下载', action: (file) => downloadFile(file.id, file.access_token) },
      { label: '属性', action: (file) => downloadFile(file.id, file.access_token) },
    ];
    if (file.isFolder) {
      items.splice(items.length - 1, 0, { label: '同步目录内容', action: (file) => handleSyncFile(file) });
      if (temFile.length && !temFile.some(e => e.id == file.id)) {
        items.splice(2, 0, { label: '粘贴', action: (target) => handlePaste(target) });
      }
    }
  } else {
    items = [
      { label: '刷新', action: () => fileStore.forceRefresh() },
      { label: '新建文件夹', action: () => handleCreateFolder() },
      { label: '新建文件', action: () => handleCreateFolder() },
      { label: '同步目录内容', action: () => handleSyncFile() },
    ];
    if (selectFiles.length) {
      items.splice(1, 0, { label: '复制', action: () => temFile.splice(0, temFile.length, ...selectFiles) });
    }
    if (temFile.length) {
      const last = fileStore.breadcrumbs[fileStore.breadcrumbs.length - 1];
      if (!last || !temFile.some(e => e.id == last.id)) items.splice(2, 0, { label: '粘贴', action: (target) => handlePaste(target) });
    }
  }
  showMenu(items, event, file)
}

function handlePaste(target) {
  if (!target) target = fileStore.breadcrumbs[fileStore.breadcrumbs.length - 1];
  fileStore.loading = true
  loadingText.value = '正在复制文件中...'
  copyFile({
    destId: target.id,
    ids: temFile.map(e => e.id)
  }).then(_res => {
    ElMessage.success("粘贴成功")
    fileStore.forceRefresh();
  }).finally(() => {
    fileStore.loading = false
  })
}

function handleSyncFile(file) {
  if (file && !file.isFolder) return;
  if (!file) {
    file = fileStore.breadcrumbs[fileStore.breadcrumbs.length - 1]
  }
  ElMessageBox.confirm(
    '确认同步此目录吗？同步过程中将根据磁盘实际内容更新数据库，未在磁盘中存在的文件将被移除。请勿在同步期间对文件进行增删改操作，以避免数据不一致或文件损坏。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger',
      beforeClose: (action, instance, done) => {
        if (action === 'confirm') {
          instance.confirmButtonLoading = true
          instance.confirmButtonText = 'Loading...'
          syncFile({
            id: file ? file.id : 0
          }).then(_res => {
            done()
            ElMessage.success("同步成功")
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

function handleCreateFolder() {
  ElMessageBox.prompt('请输入文件夹名称', '创建文件夹', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPlaceholder: '请输入文件夹名称',
    inputPattern: /^.+$/,
    inputErrorMessage: '文件夹名称不能为空',
    inputValue: '新建文件夹',
    beforeClose: (action, instance, done) => {
      if (action === 'confirm') {
        instance.confirmButtonLoading = true
        instance.confirmButtonText = '创建中...'
        const pId = fileStore.breadcrumbs.length > 0 ? fileStore.breadcrumbs[fileStore.breadcrumbs.length - 1].id : 0;
        createFolder({
          name: instance.inputValue,
          parentId: pId
        }).then(_res => {
          done()
          ElMessage.success("创建成功")
          fileStore.forceRefresh();
        }).finally(() => {
          instance.confirmButtonLoading = false
          instance.confirmButtonText = '确定'
        })
      } else {
        done()
      }
    },
  }).catch(() => { })
}

watch(() => fileStore.files.length, () => handleTableSelectionChange([]))

function handleTableSelectionChange(e) {
  selectFiles.splice(0, selectFiles.length, ...e);
}

const radio = ref("1")
function deleteFileFun(files) {
  ElMessageBox({
    title: '警告',
    message: () => h('div', {}, [
      h('div', { class: 'text-red-500 text-sm mt-1 mb-2 line-clamp-3 ' }, `确定要删除${files.map(f => f.name).join(",")}吗?`),
      h(ElRadioGroup, {
        modelValue: radio.value,
        options: [
          { label: '永久删除', value: '0' },
          { label: '添加到回收站', value: '1' },
        ],
        'onUpdate:modelValue': (val) => {
          radio.value = val
        },
      }),
    ]),
    beforeClose: (action, instance, done) => {
      if (action === 'confirm') {
        instance.confirmButtonLoading = true
        instance.confirmButtonText = 'Loading...'
        deleteFile({
          fileIds: files.map(e => e.id),
          status: radio.value
        }).then(_res => {
          done()
          ElMessage.success("删除成功")
          fileStore.forceRefresh();
        }).finally(() => {
          instance.confirmButtonLoading = false
          instance.confirmButtonText = '确定'
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


<style>
.no-rotate-loading .el-loading-spinner {
  animation: none !important;
}

.no-rotate-loading .el-loading-spinner svg {
  animation: none !important;
  transform: none !important;
}

.el-loading-spinner .circular {
  height: 120px !important;
  width: 400px !important;
}
</style>