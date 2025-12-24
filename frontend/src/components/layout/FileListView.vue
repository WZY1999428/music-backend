<template>
    <div class="h-full" ref="tableDivRef">
        <el-table :data="files" show-overflow-tooltip @cell-dblclick="handleDblClick" style="width: 100%; "
            :height="tableHeight">
            <el-table-column label="序号" type="index" width="55" align="center"></el-table-column>
            <el-table-column label="文件图标" width="80" align="center">
                <template #default="{ row }">
                    <div class="flex justify-center">
                        <icon :name="formatFileIcon(row)"></icon>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="文件名" prop="name"></el-table-column>
            <el-table-column label="大小" prop="size" width="100">
                <template #default="{ row }">
                    {{ formatFileSize(row.size) }}
                </template>
            </el-table-column>
            <el-table-column label="类型" prop="category" width="100">
                <template #default="{ row }">{{ row.isFolder == 1 ? '文件夹' : row.category }}</template>
            </el-table-column>
            <el-table-column label="创建日期" prop="createdAt" width="180"></el-table-column>
            <el-table-column label="最后更新日期" prop="updatedAt" width="180"></el-table-column>
            <el-table-column label="操作" prop="updatedAt" width="160" fixed="right" align="center">
                <template #default="scope">
                    <template v-if="fileStore.queryType != 'recycleBin'">
                        <el-button @click="emit('download', scope.row)" link type="primary" size="small">下载</el-button>
                        <el-button link size="small" @click="emit('delete', [scope.row])" type="danger">删除</el-button>
                    </template>
                    <template v-else>
                        <el-button link @click="emit('recently', [scope.row])" type="primary"
                            size="small">恢复</el-button>
                        <el-button link type="danger" size="small">永久删除</el-button>
                    </template>
                </template>
            </el-table-column>
            <template #empty>
                <template v-if="!fileStore.loading">
                    <el-empty v-if="!fileStore.error" description="文件夹空空的"></el-empty>
                    <el-empty v-else description="网络请求失败了">
                        <el-button type="primary" @click="fileStore.refresh">刷新</el-button>
                    </el-empty>
                </template>
            </template>
        </el-table>
    </div>
</template>


<script setup>
const prps = defineProps({
    files: {
        type: Array,
        required: true
    }
});
const emit = defineEmits(['dbclick', "download", "delete", "recently"]);
const tableDivRef = ref(null);
const fileStore = useFileStore();
const tableHeight = ref(500);
let observer = null;
onMounted(() => {
    setTableHeight();
    observer = new ResizeObserver(([entry]) => {
        if (entry.contentBoxSize) setTableHeight();
    });
    tableDivRef.value && observer.observe(tableDivRef.value);
});

function setTableHeight() {
    if (tableDivRef.value) {
        tableHeight.value = tableDivRef.value.offsetHeight;
        if (tableHeight.value < 200) tableHeight.value = 200;
    }
}
window.addEventListener('resize', setTableHeight);
onUnmounted(() => {
    observer?.unobserve(tableDivRef.value);
    window.removeEventListener('resize', setTableHeight);
});

const handleDblClick = (row) => {
    if (fileStore.queryType != 'recycleBin') {
        emit('dbclick', row);
    }
}
</script>