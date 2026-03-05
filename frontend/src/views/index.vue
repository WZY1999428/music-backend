<template>
  <el-container class="h-screen p-2" style="background-color: var(--container-bg-color)">
    <el-header class="px-4 shadow-md select-none rounded-sm mb-2"
      style="height: 70px; background-color: var(--header-bg-color)">
      <cloudHeader></cloudHeader>
    </el-header>
    <el-container>
      <el-aside width="260px" style="background-color: var(--aside-bg-color); margin-right: 10px"
        class="rounded-sm shadow-md select-none p-4">
        <cloudAside></cloudAside>
      </el-aside>
      <el-main style="padding: 0">
        <DragUploadArea>
          <router-view></router-view>
        </DragUploadArea>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import cloudHeader from "@/components/cloudHeader.vue";
import cloudAside from "@/components/cloudAside.vue";
import DragUploadArea from "@/components/DragUploadArea.vue";
</script>

<style>
/* 侧边栏项的基本样式 */
.aside-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  color: var(--el-text-color-primary);
  /* 继承主题颜色 */
}

/* 鼠标悬停和激活状态 */
.aside-item:hover {
  background-color: var(--el-color-primary-light-9);
  /* Element Plus 浅色悬停效果 */
  color: var(--el-color-primary);
}

.aside-item.active {
  background-color: var(--el-color-primary-light-8);
  /* 激活背景 */
  color: var(--el-color-primary);
  /* 激活文字颜色 */
  font-weight: 600;
}
</style>
