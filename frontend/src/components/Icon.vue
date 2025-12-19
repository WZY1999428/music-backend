<template>
    <svg class="icon" :style="{
        width: size + 'px',
        height: size + 'px'
    }" v-if="fontClassList.includes(props.name)" aria-hidden="true">
        <use :xlink:href="`#icon-${xlinkHref()}`"></use>
    </svg>
</template>

<script setup>
import iconfont from "@/assets/iconfont/iconfont.json";
import { watch } from "vue";
const fontClassList = iconfont.glyphs.map(item => item.name);
const props = defineProps({
    name: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        default: 25
    }
})
validator(props.name);
watch(() => props.name, validator)
function validator(value) {
    if (!fontClassList.includes(value)) {
        console.warn(`icons name is not exist ${fontClassList.join(",")}`)
    }
}

function xlinkHref() {
    return iconfont.glyphs.find(item => item.name === props.name)?.font_class
}
</script>

<style scoped lang="scss">
.icon {
    width: 3em;
    height: 3em;
    vertical-align: -0.15em;
    fill: currentColor;
    overflow: hidden;
}
</style>