<script setup lang="ts">
import { GripVertical } from 'lucide-vue-next'

defineProps<{
  draggable?: boolean
}>()

const emit = defineEmits<{
  dragStart: [e: DragEvent]
  dragEnd: [e: DragEvent]
}>()
</script>

<template>
  <div
    class="drag-handle"
    :class="{ 'drag-handle--draggable': draggable }"
    draggable="true"
    @dragstart="emit('dragStart', $event)"
    @dragend="emit('dragEnd', $event)"
  >
    <GripVertical :size="16" />
  </div>
</template>

<style lang="scss" scoped>
.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--width-drag-handle);
  height: 100%;
  min-height: 24px;
  cursor: grab;
  opacity: 0;
  transition: opacity var(--transition-fast);
  color: var(--color-text-muted);
  flex-shrink: 0;

  &:hover {
    color: var(--color-accent);
  }

  &--draggable {
    opacity: 1;
  }

  &:active {
    cursor: grabbing;
  }
}
</style>
