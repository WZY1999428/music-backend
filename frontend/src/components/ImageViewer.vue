<template>
    <ul ref="imageViewer" id="ViewerImage" style="display: none;">
        <img v-for="src in images" :src="src"  >
    </ul>
</template>


<script setup>
import Viewer from 'viewerjs';
import "viewerjs/dist/viewer.css";
const imageViewer = ref(null);

const props = defineProps({
    images: Array
})

onMounted(init)

let viewer = null;
function init() {
    viewer = new Viewer(imageViewer.value, {
        inline: true,
        viewed() {
            viewer.zoomTo(1);
        },
        hide(){
            console.log(123123);
        }
    });
}

function show() {
    viewer.show();
}

defineExpose({ show })

</script>

<style>
</style>