<template>
    <div class="h-full" ref="tableDivRef">
        <el-table :data="files" show-overflow-tooltip @cell-dblclick="handleDblClick" style="width: 100%; "
            @selection-change="(e) => emit('tableSelectionChange', e)" @row-contextmenu="handleRowContextMenu"
            :height="tableHeight">
            <template v-if="fileStore.queryType == 'favorite'">
                <el-table-column label="序号" type="selection" width="30" align="center"></el-table-column>
                <el-table-column type="index" width="55" align="center"></el-table-column>
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
                <el-table-column label="收藏日期" prop="createdAt" width="180"></el-table-column>
                <el-table-column label="操作" prop="updatedAt" width="160" fixed="right" align="center">
                    <template #default="scope">
                        <el-button @click="emit('download', scope.row)" link type="primary" size="small">下载</el-button>
                        <el-button link size="small" @click="emit('unfavorite', [scope.row])"
                            type="danger">取消收藏</el-button>
                    </template>
                </el-table-column>
            </template>

            <template v-else-if="fileStore.queryType != 'recycleBin'">
                <el-table-column label="序号" type="selection" width="30" align="center"></el-table-column>
                <el-table-column type="index" width="55" align="center"></el-table-column>
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
                        <el-button @click="emit('download', scope.row)" link type="primary" size="small">下载</el-button>
                        <el-button link size="small" @click="emit('delete', [scope.row])" type="danger">删除</el-button>
                    </template>
                </el-table-column>
            </template>


            <template v-else-if="fileStore.queryType == 'recycleBin'">
                <el-table-column label="序号" type="selection" width="30" align="center"></el-table-column>
                <el-table-column type="index" width="55" align="center"></el-table-column>
                <el-table-column label="文件图标" width="80" align="center">
                    <template #default="{ row }">
                        <div class="flex justify-center">
                            <icon :name="formatFileIcon(row)"></icon> 
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="文件名" prop="name"></el-table-column>
                <el-table-column label="类型" prop="category" width="100">
                    <template #default="{ row }">{{ row.isFolder == 1 ? '文件夹' : row.category }}</template>
                </el-table-column>
                <el-table-column label="删除日期" prop="createdAt" width="180"></el-table-column>
                <el-table-column label="操作" prop="updatedAt" width="160" fixed="right" align="center">
                    <template #default="{ row }">
                        <el-button link @click="emit('recently', [row])" type="primary" size="small">恢复</el-button>
                        <el-button link type="danger" size="small">永久删除</el-button>
                    </template>
                </el-table-column>
            </template>


            <template #empty>
                <template v-if="!fileStore.loading">
                    <el-empty v-if="!fileStore.error" description="暂无文件"></el-empty>
                    <el-empty v-else description="网络请求失败了">
                        <el-button type="primary" @click="fileStore.forceRefresh">刷新</el-button>
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
const emit = defineEmits(['dbclick', "download", "delete", "recently", "tableSelectionChange", "row-contextmenu", "unfavorite"]);
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
    if (tableDivRef.value) {
        observer?.unobserve(tableDivRef.value);
    }
    window.removeEventListener('resize', setTableHeight);
});

function handleRowContextMenu(row, _column, event) {
    emit('row-contextmenu', { event, file: row });
    event.stopPropagation();
}
const handleDblClick = (row) => {
    if (fileStore.queryType != 'recycleBin') {
        emit('dbclick', row);
    }
}
</script>