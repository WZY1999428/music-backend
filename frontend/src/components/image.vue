<template>
    <div class="w-[80px] h-[80px] overflow-hidden relative" ref="el" v-loading="loading" >
        <img v-if="!isError && imgUrl" ref="imgRef" :src="imgUrl" class="w-full h-full object-cover"
            @load="loading = false" @error="onError" />
        <icon v-else-if="isError && !loading" @dblclick.stop :size="80" name="imageError" />
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
    id: { type: Number, required: true },
    access_token: { type: String, required: true }
});

const el = ref(null);
const imgUrl = ref('');
const loading = ref(true);
const isError = ref(false);
let observer = null;

function loadImage() {
    if (!props.id || !props.access_token) return;
    loading.value = true;
    isError.value = false;
    imgUrl.value = getThumbUrl(props.id, props.access_token);
}

function onError() {
    isError.value = true;
    loading.value = false;
}

onMounted(() => {
    observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
                loadImage();
            }
        },
        { threshold: 0.1 }
    );
    el.value && observer.observe(el.value);
});

onBeforeUnmount(() => {
    observer?.unobserve(el.value);
});

// 支持 props 改变时重新加载
watch(
    () => [props.id, props.access_token],
    () => loadImage()
);
</script>

<style scoped>
div {
    position: relative;
}
</style>
