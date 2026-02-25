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
    :element-loading-svg="loadingSvg" v-loading="loading" :element-loading-text="loadingText"
    element-loading-svg-view-box="0 0 400 120" element-loading-custom-class="no-rotate-loading"
    @contextmenu="(event) => handleRowContextMenu({ event, file: null })"
    style="background-color: var(--aside-bg-color); height: calc(100% - 40px)">
    <FileIconView :files="fileStore.files" @dbclick="openFile" @row-contextmenu="handleRowContextMenu" v-loading="fileStore.loading"
     v-if="viewType == 'grid'"></FileIconView>
    <FileListView v-else :files="fileStore.files" @dbclick="openFile" v-loading="fileStore.loading"
      @download="(e) => downloadFile(e.id, e.access_token)" @delete="deleteFileFun" @recently="recentlyFilesFun"
      @tableSelectionChange="handleTableSelectionChange" @row-contextmenu="handleRowContextMenu"
      @unfavorite="toggleFavorite">
    </FileListView>
  </div>
</template>

<script setup>
import FileListView from "@/components/layout/FileListView.vue";
import FileIconView from "@/components/layout/FileIconView.vue";
import {
  fileStore, loadingSvg, loading, loadingText, selectFiles, viewType,
  handleRowContextMenu, openFile, recentlyFilesFun, onMouseup, handleCreateFolder, handleTableSelectionChange, deleteFileFun, toggleFavorite
} from "./fileHandlers"
watch(() => fileStore.files.length, () => handleTableSelectionChange([]))
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