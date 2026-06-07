<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { rafThrottle } from '@/utils/debounce'

const props = defineProps<{
  columnIndex: number
}>()

const emit = defineEmits<{
  resizeStart: [index: number]
  resize: [index: number, width: number]
  resizeEnd: [index: number]
}>()

const isResizing = ref(false)
const startX = ref(0)
const containerRef = ref<HTMLElement | null>(null)

const handleMouseMove = rafThrottle((e: MouseEvent) => {
  if (!isResizing.value || !containerRef.value) return

  const container = containerRef.value.parentElement
  if (!container) return

  const containerRect = container.getBoundingClientRect()
  const totalWidth = containerRect.width
  const deltaX = e.clientX - startX.value
  const deltaPercent = (deltaX / totalWidth) * 100

  const currentColumn = container.children[props.columnIndex] as HTMLElement
  if (!currentColumn) return

  const currentWidthPercent = (currentColumn.offsetWidth / totalWidth) * 100
  const newWidth = currentWidthPercent + deltaPercent

  emit('resize', props.columnIndex, newWidth)
  startX.value = e.clientX
})

function handleMouseDown(e: MouseEvent) {
  isResizing.value = true
  startX.value = e.clientX
  emit('resizeStart', props.columnIndex)
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function handleMouseUp() {
  if (!isResizing.value) return
  
  isResizing.value = false
  emit('resizeEnd', props.columnIndex)
  
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

onMounted(() => {
  containerRef.value = document.querySelector('.columns-container') as HTMLElement
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div
    class="resize-handle"
    :class="{ 'resize-handle--resizing': isResizing }"
    @mousedown="handleMouseDown"
  >
    <div class="resize-handle__indicator" />
  </div>
</template>

<style lang="scss" scoped>
.resize-handle {
  position: relative;
  width: var(--width-resize-handle);
  min-width: var(--width-resize-handle);
  cursor: col-resize;
  z-index: 10;
  transition: width var(--transition-fast);
  background-color: transparent;

  &:hover,
  &--resizing {
    width: 8px;
    min-width: 8px;
    
    .resize-handle__indicator {
      background-color: var(--color-accent);
      opacity: 1;
    }
  }

  &__indicator {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    background-color: var(--color-border);
    opacity: 0.5;
    transition: all var(--transition-fast);
  }
}
</style>
