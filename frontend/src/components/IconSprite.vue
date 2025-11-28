<template>
    <svg class="icon" aria-hidden="true">
        <use :xlink:href="`#${name}`"></use>
    </svg>
</template>

<script setup>
import iconfont from "@/assets/iconfont/iconfont.json";
import { watch } from "vue";
const fontClassList = iconfont.glyphs.map(item => item.font_class);
const props = defineProps({
    name: {
        type: String,
        required: true,
    }
})
validator(props.name);
watch(() => props.name, validator)
function validator(value) {
    if (!fontClassList.includes(value)) {
        throw new Error(`icons name is not exist ${fontClassList.join(",")}`)
    }
}

function xlinkHref() {
    return
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