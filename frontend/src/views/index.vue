<template>
  <el-container class="h-screen p-2" style="background-color: var(--container-bg-color)">
    <el-header class="px-4 shadow-md select-none rounded-sm mb-2"
      style="height: 80px; background-color: var(--header-bg-color)">
      <div class="flex justify-between h-full">
        <div class="flex items-center h-full">
          <el-image src="/logo2.png" class="w-[40px]"></el-image>
          <h3 class="ml-4 font-bold text-2xl">小清新云盘</h3>
        </div>
        <div class="flex items-center h-full pr-20">
          <el-button type="primary">上传</el-button>
          <el-button type="warning">新建文件夹</el-button>
          <el-input class="ml-9" style="width: 240px; --el-border-color: #aec7b3" placeholder="搜索"
            v-model="fileStore.keyword" @keyup.enter="fileStore.forceRefresh" :prefix-icon="Search" />
          <div class="ml-10">
            <el-dropdown>
              <span class="el-dropdown-link cursor-pointer flex flex-col items-center">
                <el-avatar :size="40" :src="avatarImg" class="mb-2"></el-avatar>
                {{ userStore.userInfo?.username || "未登录" }}
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
      <el-aside width="260px" style="background-color: var(--aside-bg-color); margin-right: 10px"
        class="rounded-sm shadow-md select-none p-4">
        <div v-for="(item, index) in menuItems" :key="index">
          <div class="mb-6">
            <h4 class="text-sm font-semibold text-gray-500 mb-2 tracking-wider">
              {{ item.name }}
            </h4>
            <menu class="space-y-1">
              <li @click="handleClick(item.id, child)" :class="['aside-item', activeIndex === child.id ? 'active' : '']"
                v-for="child in item.children" :key="child.id">
                <icon :name="child.icon"></icon>
                <span class="ml-3">{{ child.name }}</span>
              </li>
            </menu>
          </div>
          <el-divider class="my-3"></el-divider>
        </div>

        <div class="p-2 mt-4 bg-gray-50 rounded-md" v-if="systemInfo.disk">
          <h4 class="text-sm font-semibold text-gray-600 mb-2">我的容量</h4>
          <el-progress :percentage="systemInfo.disk.usage" :stroke-width="15" :color="'#5ad89f'"
            text-inside></el-progress>
          <div class="mt-2 text-xs text-gray-500">
            已使用 {{ formatFileSize(systemInfo.disk.used) }} / 总共
            {{ formatFileSize(systemInfo.disk.total) }}
          </div>
        </div>
        <div class="p-2 mt-4 bg-gray-50 rounded-md" v-if="systemInfo.memory">
          <h4 class="text-sm font-semibold text-gray-600 mb-2">我的内存</h4>
          <el-progress :percentage="systemInfo.memory.usage" :stroke-width="15" :color="'#5ad89f'"
            text-inside></el-progress>
          <div class="mt-2 text-xs text-gray-500">
            已使用 {{ formatFileSize(systemInfo.memory.used) }} / 总共
            {{ formatFileSize(systemInfo.memory.total) }}
          </div>
        </div>
      </el-aside>
      <el-main style="padding: 0">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { Search } from "@element-plus/icons-vue";
import avatarImg from "@/assets/avatar.png";
const fileStore = useFileStore();
import { getStorageStatus } from "@/request/system";
import { ref } from "vue";
const userStore = useUserStore();
const activeIndex = ref("myFile");
//  我的文件 最近使用 收藏夹 回收站
const menuItems = [
  {
    name: "导航",
    id: "nav",
    children: [
      {
        name: "我的文件",
        icon: "folder",
        id: "myFile",
      },
      {
        name: "最近使用",
        icon: "FolderShare",
        id: "recentlyUsed",
      },
      {
        name: "收藏夹",
        icon: "FolderFavorite",
        id: "collection",
      },
      {
        name: "回收站",
        icon: "FolderRecycle",
        id: "recycleBin",
      },
    ],
  },
  {
    name: "文件分类",
    id: "category",
    children: [
      {
        name: "图片",
        icon: "image",
        id: "image",
      },
      {
        name: "视频",
        icon: "video",
        id: "video",
      },
      {
        name: "文档",
        icon: "record",
        id: "document",
      },
      {
        name: "音频",
        icon: "audio",
        id: "audio",
      },
      {
        name: "压缩包",
        icon: "archive",
        id: "archive",
      },
      {
        name: "其他",
        icon: "unknown",
        id: "other",
      },
    ],
  },
];

function handleClick(type, item) {
  activeIndex.value = item.id;
  fileStore.setFileType(type == "category" ? type : item.id, item.id);
}
const systemInfo = ref({});
getSystemInfo();
function getSystemInfo() {
  getStorageStatus()
    .then((res) => (systemInfo.value = res.data))
    .finally(() => getItem("token") && setTimeout(getSystemInfo, 1000 * 5));
}
if (getItem("token")) userStore.fetchUserInfo();
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
