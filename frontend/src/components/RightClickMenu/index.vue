<template>
  <div class="fixed z-[9999]" :style="{ top: y1 + 'px', left: x1 + 'px' }" @click.stop @contextmenu.prevent
    @mouseenter="clearHideTimer" @mouseleave="startHideTimer">
    <menu class="bg-white py-1 shadow-lg rounded-sm overflow-hidden border border-gray-200 w-[220px]">
      <li v-for="(item, index) in items" :key="item.label" @click="onClick(item)"
        :class="['pl-4 pr-2 py-2 hover:bg-gray-100 cursor-pointer text-gray-800 text-sm flex justify-between items-center relative', activeChildrenIndex === index ? 'bg-gray-100' : '']"
        @mouseenter="onItemEnter($event, item, index)">
        <div class="flex">
          <span class="w-[25px]">
            <icon :size="20" :name="item.icon"></icon>
          </span>
          <span>{{ item.label }}</span>
        </div>
        <el-icon v-if="item.children && item.children.length" size="14" class="text-gray-400">
          <ArrowRight />
        </el-icon>
      </li>
    </menu>

    <RightClickMenu ref="childMenuRef" v-if="showChild" :items="activeChildren" :x="childrenX" :y="childrenY"
      @select="emit('select', $event)" @close="emit('close')" @mouseenter-child="clearHideTimer"
      @mouseleave-child="startHideTimer" />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, defineOptions } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
// 显式引用自身用于递归，或者依赖文件名 (index.vue)
import RightClickMenu from './index.vue'

defineOptions({
  name: 'RightClickMenu'
})

const props = defineProps({
  items: { type: Array, default: () => [] },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 }
})

const emit = defineEmits(['select', 'close', 'mouseenter-child', 'mouseleave-child'])

const x1 = ref(0)
const y1 = ref(0)
const childrenX = ref(0)
const childrenY = ref(0)
const activeChildren = ref([])
const showChild = ref(false)
const childMenuRef = ref(null)
const activeChildrenIndex = ref(-1)
// 这里的 menuRef 指的是外层 div
const menuWidth = 220
let timerRef = null

// 监听坐标变化，支持组件复用时的位置更新
watch(() => [props.x, props.y], () => {
  adjustPosition()
}, { immediate: true })

function adjustPosition() {
  x1.value = props.x
  y1.value = props.y
  // 等待渲染后修正边界
  nextTick(() => {
    // 简单的视口边界判定
    if (x1.value + menuWidth > window.innerWidth) {
      x1.value = x1.value - menuWidth
    }
    // 这里的 height 最好动态获取，或者给个兜底
    // 简单处理：如果太靠下，稍微往上提一点，或者由 CSS 控制 max-height
    const estimatedHeight = props.items.length * 36 + 10
    if (y1.value + estimatedHeight > window.innerHeight) {
      y1.value = window.innerHeight - estimatedHeight - 10
    }
  })
}

function onClick(item) {
  if (!item.children || item.children.length === 0) {
    emit('select', item)
    emit('close') // 关闭所有菜单
  }
}

function onItemEnter(event, item, index) {
  // 如果进入了某个菜单项，先清除关闭定时器，因为鼠标还在菜单范围内
  clearHideTimer()
  if (!item.children || !item.children.length) {
    // 如果该项没有子菜单，延迟关闭当前已显示的子菜单（防抖）
    // 这里的逻辑：如果用户快速滑过有子菜单的项去点击无子菜单的项，不应立即关闭子菜单
    showChild.value = false
    activeChildrenIndex.value = -1
    return
  }

  activeChildrenIndex.value = index;
  // 计算子菜单位置
  const parentRect = event.currentTarget.getBoundingClientRect()

  // 默认向右展开
  let nextX = parentRect.right
  // 如果右边空间不够，改为向左展开 (当前位置 - 子菜单宽 - 主菜单宽)
  // 注意：这里简单处理，实际要看层级
  if (nextX + menuWidth > window.innerWidth) {
    nextX = parentRect.left - menuWidth
  }

  childrenX.value = nextX
  childrenY.value = parentRect.top - 5 //稍微上移一点对齐

  activeChildren.value = item.children
  showChild.value = true
}

// === 核心逻辑：定时器防抖 ===

function startHideTimer() {
  // 向上级组件报告：我准备关闭了
  emit('mouseleave-child')
  // 只有顶层组件需要真正执行关闭逻辑，或者每一层自己管自己
  // 这里采用每一层自己管自己的策略：
  activeChildrenIndex.value = -1
  timerRef = setTimeout(() => {
    showChild.value = false
  }, 100) // 100ms 缓冲期
}

function clearHideTimer() {
  // 向上级报告：鼠标进来了，别关！
  emit('mouseenter-child')
  if (timerRef) {
    clearTimeout(timerRef)
    timerRef = null
  }
}

// 暴露给父组件调用（如果需要强制关闭）
function hide() {
  showChild.value = false
  if (childMenuRef.value) {
    childMenuRef.value.hide()
  }
}

defineExpose({ hide })
</script>