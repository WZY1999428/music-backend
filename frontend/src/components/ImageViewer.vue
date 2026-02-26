<template>
    <div ref="imageViewer" style="display: none;">
        <img :src="img" :alt="img" v-for="img in images">
    </div>
</template>


<script setup>
import Viewer from 'viewerjs';
import "viewerjs/dist/viewer.css";
const imageViewer = ref(null);

const props = defineProps({
    images: Array,
    opts: {
        type: Object,
        default: () => ({
            index: 0,
            loop: false,
        })
    }
})
onMounted(init)
let viewer = null;
function init() {
    viewer = new Viewer(imageViewer.value, {
        className: "imageViewer",
        inline: false,
        loop: props.opts.loop
    });
    viewer.view(props.opts.index);
    viewer.show()
}

defineExpose({
    show() {
        viewer.show()
    },
    hide() {
        viewer.hide()
    }
})

</script>

<style lang="scss">
.imageViewer {
    width: 100%;
    height: 100vh;
    position: fixed;
    inset: 0 0 0 0;
}
</style>