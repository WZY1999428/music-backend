<template>
  <ul
    ref="rightMenuRef"
    class="absolute bg-white py-1 shadow-lg rounded-xs overflow-hidden border border-gray-200 w-36 z-[9999]"
    :style="{ top: y1 + 'px', left: x1 + 'px' }"
    @click.stop
  >
    <li
      v-for="item in items"
      :key="item.label"
      @click="onClick(item)"
      class="px-4 py-1 hover:bg-gray-100 cursor-pointer text-gray-800 text-sm"
    >
      {{ item.label }}
    </li>
  </ul>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps({
  items: Array,
  x: Number,
  y: Number
})

const x1 = ref(props.x)
const y1 = ref(props.y)
const rightMenuRef = ref(null)
const emit = defineEmits(['select', 'close'])

onMounted(() => {
  nextTick(() => {
    const rect = rightMenuRef.value.getBoundingClientRect()
    if (rect.right > window.innerWidth) {
      x1.value = window.innerWidth - rect.width - 8
    }
    if (rect.bottom > window.innerHeight) {
      y1.value = window.innerHeight - rect.height - 8
    }
  })
})

function onClick(item) {
  emit('select', item)
  emit('close')
}
</script>
