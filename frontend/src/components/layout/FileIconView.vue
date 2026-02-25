<template>
    <div ref="fileGrid" class="file-grid flex flex-wrap">
        <div @dblclick="emit('dbclick', file)" @contextmenu.stop="emit('row-contextmenu', { event: $event, file })"
            class="file-item h-[130px] flex flex-col items-center cursor-pointer" v-for="file in files"
            :key="file.access_token">
            <div class="relative">
                <id-image v-if="['png', 'jpg', 'jpeg','webp'].includes(file.extension)" :id="file.id"
                    :access_token="file.access_token"></id-image>
                <icon v-else :size="80" :name="formatFileIcon(file)" />
                <img v-if="file.isFolder !== 1 && file.favoriteId" class="star absolute top-1 right-1  w-[20px]"
                    :src="star" alt="收藏">
            </div>
            <p class="py-1 text-sm text-center line-clamp-2 break-words w-[80px]">
                {{ file.name }}
            </p>
        </div>
    </div>
</template>

<script setup>
import idImage from "../image.vue";
import star from "@/assets/svg/star.svg"
const props = defineProps({
    files: {
        type: Array,
        required: true,
    },
});

const emit = defineEmits(['dbclick', "tableSelectionChange", "row-contextmenu"]);
const fileGrid = ref(null);
function updateGridGap() {
    const container = fileGrid.value;
    if (!container) return;

    const containerWidth = container.clientWidth;

    const fileItem = container.querySelector('.file-item');
    if (!fileItem) return;

    const itemStyle = window.getComputedStyle(fileItem);
    const itemWidth = fileItem.offsetWidth + parseFloat(itemStyle.marginLeft) + parseFloat(itemStyle.marginRight);

    const n = Math.floor(containerWidth / itemWidth); // 每行最多放多少个
    if (n <= 1) return;

    const gap = (containerWidth - n * itemWidth) / (n - 1);
    container.style.gap = `${gap}px`;
}

onMounted(() => {
    setTimeout(() => {
        updateGridGap();
        window.addEventListener('resize', updateGridGap);
    }, 60);
});

</script>

<style scoped lang="scss">
.file-grid {
    .file-item {
        padding: 5px 10px;
        border-radius: 10px;
        transition: background 0.3s;

        &:hover {
            background-color: var(--el-color-primary-light-9);
            color: var(--el-color-primary);
        }
    }
}
</style>
