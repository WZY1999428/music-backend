<template>
    <div class="flex justify-between h-full">
        <div class="flex items-center h-full">
            <el-image src="/logo2.png" class="w-[40px]"></el-image>
            <h3 class="ml-4 font-bold text-2xl">小清新云盘</h3>
        </div>
        <div class="flex items-center h-full pr-20">
            <div class="flex items-center">
                <el-popover trigger="click" :width="700" placement="bottom" popper-class="upload-popover">
                    <div class="w-full">
                        <div class="upload-popover-header flex items-center select-none">
                            <el-icon>
                                <Upload />
                            </el-icon>
                            <h3 class="ml-2 text-[14px]">文件上传列表</h3>
                        </div>
                        <div class="upload-popover-content">
                            <div class="upload-popover-list p-2 h-[480px] overflow-y-auto custom-scrollbar">
                                <div v-for="item in uploadStore.uploadList" :key="item.id" class="upload-item group relative p-3 mb-2 rounded-lg border border-gray-100
                                    bg-white hover:bg-blue-50/30 hover:border-blue-100 transition-all duration-300
                                    shadow-sm hover:shadow">
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="flex items-center space-x-2 truncate pr-4">
                                            <el-icon class="text-blue-500 text-lg">
                                                <Document />
                                            </el-icon>
                                            <h3 class="text-sm font-medium text-gray-700 truncate w-70"
                                                :title="item.filename">{{ item.filename }}</h3>
                                        </div>
                                        <div class="flex items-center shrink-0">
                                            <span v-if="item.status == UploadStatus.pending"
                                                class="status-tag flex items-center text-xs text-orange-500 font-medium  px-2 py-0.5 rounded">
                                                <el-icon class="mr-1">
                                                    <CoffeeCup />
                                                </el-icon>
                                                等待上传
                                            </span>
                                            <span v-else-if="item.status == UploadStatus.waitingHashing"
                                                class="status-tag flex items-center text-xs text-orange-500 font-medium  px-2 py-0.5 rounded">
                                                <el-icon class="mr-1">
                                                    <CoffeeCup />
                                                </el-icon>
                                                等待文件哈希计算
                                            </span>
                                            <span v-else-if="item.status == UploadStatus.paused"
                                                class="status-tag flex items-center text-xs text-orange-500 font-medium  px-2 py-0.5 rounded">
                                                <el-icon class="mr-1">
                                                    <VideoPause />
                                                </el-icon>
                                                已暂停
                                            </span>

                                            <el-tooltip effect="dark" v-else-if="item.status == UploadStatus.failed"
                                                :content="item.error">
                                                <span
                                                    class="status-tag flex items-center text-xs text-red-500 font-medium  px-2 py-0.5 rounded">
                                                    <el-icon class="mr-1">
                                                        <Warning />
                                                    </el-icon>
                                                    上传失败
                                                </span>
                                            </el-tooltip>

                                            <span v-else-if="item.status == UploadStatus.completed"
                                                class="status-tag flex items-center text-xs text-green-600 font-medium px-2 py-0.5 rounded">
                                                <el-icon class="mr-1">
                                                    <CircleCheck />
                                                </el-icon>
                                                已完成
                                            </span>
                                            <span v-else
                                                class="status-tag flex items-center text-xs text-blue-600 font-medium  px-2 py-0.5 rounded">
                                                <el-icon class="is-loading mr-1">
                                                    <Loading />
                                                </el-icon>
                                                {{ getUploadStatusText(item.status) }}
                                            </span>
                                        </div>
                                    </div>
                                    <el-progress :percentage="item.progress" :stroke-width="4" :show-text="false"
                                        color="#409eff" />
                                    <div class="flex pt-2 items-center justify-between text-[11px] text-gray-400">
                                        <div class="flex items-center space-x-3">
                                            <span class="flex items-center">
                                                <el-icon>
                                                    <ScaleToOriginal />
                                                </el-icon>
                                                {{ formatFileSize(item.uploadedSize) }} / {{ formatFileSize(item.size)
                                                }}
                                            </span>
                                            <span class="flex items-center">
                                                <el-icon class="mr-1">
                                                    <Clock />
                                                </el-icon>
                                                {{ item.uploadDate }}
                                            </span>
                                        </div>
                                        <div class="flex items-center justify-between">
                                            <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <el-button link type="warning" size="small"
                                                    v-if="item.status == UploadStatus.uploading"
                                                    @click="uploadStore.pause(item.id)"
                                                    :icon="VideoPause">暂停</el-button>
                                                <el-button link type="primary" size="small"
                                                    v-if="item.status == UploadStatus.paused"
                                                    @click="uploadStore.resume(item.id)"
                                                    :icon="VideoPlay">继续</el-button>
                                                <el-button link type="info" size="small"
                                                    @click="uploadStore.retry(item.id)"
                                                    v-if="item.status == UploadStatus.failed"
                                                    :icon="RefreshRight">重试</el-button>
                                                <el-popconfirm class="box-item" title="确定要全部取消上传吗?"
                                                    @confirm="uploadStore.remove(item.id)" placement="top-start">
                                                    <template #reference>
                                                        <el-button link type="danger" size="small"
                                                            v-if="item.status == UploadStatus.uploading"
                                                            :icon="CircleClose">取消</el-button>
                                                    </template>
                                                </el-popconfirm>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <el-empty description="暂无上传记录" v-if="!uploadStore.uploadList.length" />
                            </div>
                            <div class="p-2" v-if="uploadStore.uploadList.length">
                                <el-pagination size="small" background layout="prev, pager, next"
                                    @change="uploadStore.getList()" :page-size="uploadStore.pageSize"
                                    v-model:current-page="uploadStore.pageIndex" :total="uploadStore.fileTotal"
                                    class="mt-2" />
                            </div>
                            <div class="upload-popover-btns  flex justify-end items-center"
                                v-if="uploadStore.uploadList.length">
                                <!-- <el-checkbox v-model="uploadStore.autoDeleteFinished">自动删除已完成任务</el-checkbox> -->
                                <div>
                                    <el-button size="small" @click="uploadStore.pauseAll()">全部暂停</el-button>
                                    <el-button size="small" @click="uploadStore.resumeAll()">全部继续</el-button>
                                    <el-popconfirm class="box-item" title="确定要全部取消上传吗?" @confirm="uploadStore.clear()"
                                        placement="top-start">
                                        <template #reference>
                                            <el-button size="small" type="danger">全部取消</el-button>
                                        </template>
                                    </el-popconfirm>
                                </div>

                            </div>
                        </div>
                    </div>
                    <template #reference>
                        <div class=" cursor-pointer h-full mr-8 flex items-center justify-center flex-col">
                            <el-badge :value="uploadStore.fileTotal" :max="100" :hidden="uploadStore.fileTotal == 0">
                                <el-icon :size="28"
                                    class="rounded-full p-1 transition-all hover:bg-blue-100 hover:scale-110 shadow-sm"
                                    title="上传文件">
                                    <UploadFilled color="#3498db" />
                                </el-icon>
                            </el-badge>
                        </div>
                    </template>
                </el-popover>

                <el-button @click="uploadFile(false)" type="primary">上传文件</el-button>
                <el-button @click="uploadFile(true)" type="primary">上传文件夹</el-button>
            </div>
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
</template>

<script setup>
import { status as UploadStatus } from "@/utils/upload/task"
import { CircleClose, Clock, Loading, ScaleToOriginal, Document, VideoPause, VideoPlay, Warning, CircleCheck, RefreshRight, Upload, CoffeeCup } from '@element-plus/icons-vue'
import { Search, UploadFilled } from "@element-plus/icons-vue";
import avatarImg from "@/assets/avatar.png";
const fileStore = useFileStore();
const uploadStore = useUploadStore();
const userStore = useUserStore();

function uploadFile(isDir) {
    let pid = fileStore.breadcrumbs.map(item => item.id).pop();
    pid = pid || 0;
    if (isDir) uploadStore.addDirs(pid);
    else uploadStore.addFile(pid);
}

uploadStore.init();

function getUploadStatusText(s) {
    const statusMap = {
        "slicing": "文件拆分中",
        "hashing": "文件哈希计算中",
        "checking": "文件校验中",
        "uploading": "文件上传中",
        "mergeing": "文件合并中",
    }
    return statusMap[s] || "未知状态"
}

</script>


<style lang="scss" scoped>
/* 隐藏滚动条但保留功能 */
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 10px;
}


.upload-popover-header {
    padding: 8px 10px;
    border-bottom: 1px solid #ebeef5;
}

.upload-popover-btns {
    padding: 8px 10px;
    border-top: 1px solid #ebeef5;
}

.upload-popover-list {
    overflow-y: auto;
}
</style>

<style lang="scss">
.upload-popover {
    --el-popover-padding: 0px;
}
</style>