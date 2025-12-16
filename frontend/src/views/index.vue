<template>
  <el-container class="h-screen  p-2" style="background-color: var(--container-bg-color);">
    <el-header class=" px-4 shadow-md select-none rounded-sm mb-2"
      style="height: 80px; background-color: var( --header-bg-color)">
      <div class="flex justify-between h-full">
        <div class=" flex items-center h-full">
          <el-image src="/logo2.png" class="w-[40px] "></el-image>
          <h3 class="ml-4 font-bold text-2xl">小清新云盘 </h3>
        </div>
        <div class="flex items-center h-full pr-20">
          <el-button type="primary">上传</el-button>
          <el-button type="warning">新建文件夹</el-button>
          <el-input class="ml-9" style="width: 240px;--el-border-color: #aec7b3;" placeholder="搜索"
            :prefix-icon="Search" />
          <div class="ml-10">
            <el-dropdown>
              <span class="el-dropdown-link cursor-pointer flex flex-col items-center">
                <el-avatar :size="40" :src="avatarImg" class="mb-2"></el-avatar>
                {{ userStore.userInfo?.username || '未登录' }}
                <i class="el-icon-arrow-down el-icon--right"></i>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>个人信息</el-dropdown-item>
                  <el-dropdown-item>设置</el-dropdown-item>
                  <el-dropdown-item divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>
    </el-header>
    <el-container>
      <el-aside width="260px" style="background-color: var(--aside-bg-color);margin-right: 10px;"
        class="rounded-sm shadow-md select-none p-4">
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-gray-500 mb-2 tracking-wider">导航</h4>
          <ul class="space-y-1">
            <li class="aside-item active">
              <icon name="folder"></icon>
              <span class="ml-3">我的文件</span>
            </li>
            <li class="aside-item">
              <icon name="FolderShare"></icon>
              <span class="ml-3">最近使用</span>
            </li>
            <li class="aside-item">
              <icon name="FolderFavorite"></icon>
              <span class="ml-3">收藏夹</span>
            </li>
            <li class="aside-item">
              <icon name="FolderRecycle"></icon>
              <span class="ml-3">回收站</span>
            </li>
          </ul>
        </div>
        <el-divider class="my-3"></el-divider>
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-gray-500 mb-2 tracking-wider">文件分类</h4>
          <ul class="space-y-1">
            <li class="aside-item">
              <icon name="image"></icon>
              <span class="ml-3">图片</span>
            </li>
            <li class="aside-item">
              <icon name="video"></icon>
              <span class="ml-3">视频</span>
            </li>
            <li class="aside-item">
              <icon name="record"></icon>
              <span class="ml-3">文档</span>
            </li>
            <li class="aside-item">
              <icon name="audio"></icon>
              <span class="ml-3">音频</span>
            </li>
            <li class="aside-item">
              <icon name="archive"></icon>
              <span class="ml-3">压缩包</span>
            </li>
            <li class="aside-item">
              <icon name="unknown"></icon>
              <span class="ml-3">其他</span>
            </li>
          </ul>
        </div>

        <el-divider class="my-3"></el-divider>

        <div class="p-2 mt-4 bg-gray-50 rounded-md">
          <h4 class="text-sm font-semibold text-gray-600 mb-2">我的容量</h4>
          <el-progress :percentage="36.5" :stroke-width="10" :color="'#5ad89f'" text-inside></el-progress>
          <div class="mt-2 text-xs text-gray-500">
            已使用 36.5 GB / 总共 100 GB
          </div>
        </div>
      </el-aside>
      <el-main style="padding: 0; ;">
        <div class="px-1 flex items-center h-[40px]">
          <el-breadcrumb>
            <el-breadcrumb-item :to="{ path: '/' }">homepage</el-breadcrumb-item>
            <el-breadcrumb-item>promotion management</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="rounded-sm shadow-md select-none p-3"
          style="background-color: var(--aside-bg-color);height: calc(100% - 40px);">
          Main
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { Search } from '@element-plus/icons-vue'
import avatarImg from "@/assets/avatar.png"
import useUserStore from '@/store/user'
const userStore = useUserStore()

userStore.getUserInfo();
</script>

<style>
/* 侧边栏项的基本样式 */
.aside-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
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