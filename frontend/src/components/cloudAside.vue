<template>
    <div>
        <div v-for="(item, index) in menuItems" :key="index">
            <div class="mb-6">
                <h4 class="text-sm font-semibold text-gray-500 mb-2 tracking-wider">
                    {{ item.name }}
                </h4>
                <menu class="space-y-1">
                    <li @click="handleClick(item.id, child)"
                        :class="['aside-item', activeIndex === child.id ? 'active' : '']" v-for="child in item.children"
                        :key="child.id">
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
    </div>
</template>


<script setup>
import { getStorageStatus } from "@/request/system";
const fileStore = useFileStore();
const userStore = useUserStore();
const systemInfo = ref({});
let timer = null;

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
                id: "recentFiles",
            },
            {
                name: "收藏夹",
                icon: "FolderFavorite",
                id: "favorite",
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


onMounted(() => getSystemInfo());
function getSystemInfo() {
    getStorageStatus()
        .then((res) => (systemInfo.value = res.data))
        .finally(() => getItem("token") && setTimeout(getSystemInfo, 1000 * 5));
}
onBeforeUnmount(() => clearTimeout(timer));
if (getItem("token")) userStore.fetchUserInfo();
function handleClick(type, item) {
    activeIndex.value = item.id;
    fileStore.setFileType(type == "category" ? type : item.id, item.id);
}
</script>