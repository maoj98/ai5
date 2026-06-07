<script setup lang="ts">
import { ref, computed } from 'vue'
import Paragraph from './Paragraph.vue'
import type { Column as ColumnType, Paragraph as ParagraphType } from '@/types/document'
import { useEditor } from '@/composables/useEditor'

const props = defineProps<{
  column: ColumnType
  columnIndex: number
  isActive: boolean
  draggingParagraphId: string | null
  dragOverIndex: number | null
}>()

const emit = defineEmits<{
  paragraphInput: [columnId: string, paragraphId: string, content: string]
  paragraphFocus: [columnId: string, paragraphId: string]
  paragraphDragStart: [e: DragEvent, columnId: string, index: number]
  paragraphDragEnd: [e: DragEvent]
  paragraphDragOver: [e: DragEvent, columnId: string, index: number]
  paragraphDrop: [e: DragEvent, columnId: string, index: number]
}>()

const { activeParagraphId, activeColumnId } = useEditor()

const paragraphRefs = ref<Map<string, InstanceType<typeof Paragraph>>>(new Map())

const columnStyle = computed(() => ({
  width: `${props.column.width}%`,
  minWidth: '20%',
}))

function setParagraphRef(el: any, paragraphId: string) {
  if (el) {
    paragraphRefs.value.set(paragraphId, el)
  } else {
    paragraphRefs.value.delete(paragraphId)
  }
}

function handleParagraphInput(paragraphId: string, content: string) {
  emit('paragraphInput', props.column.id, paragraphId, content)
}

function handleParagraphFocus(paragraphId: string) {
  emit('paragraphFocus', props.column.id, paragraphId)
}

function handleParagraphDragStart(e: DragEvent, index: number) {
  emit('paragraphDragStart', e, props.column.id, index)
}

function handleParagraphDragEnd(e: DragEvent) {
  emit('paragraphDragEnd', e)
}

function handleParagraphDragOver(e: DragEvent, index: number) {
  emit('paragraphDragOver', e, props.column.id, index)
}

function handleParagraphDrop(e: DragEvent, index: number) {
  emit('paragraphDrop', e, props.column.id, index)
}

function handleColumnClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.classList.contains('column')) {
    const lastParagraph = props.column.paragraphs[props.column.paragraphs.length - 1]
    if (lastParagraph) {
      const ref = paragraphRefs.value.get(lastParagraph.id)
      ref?.focus()
    }
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const lastIndex = props.column.paragraphs.length
  emit('paragraphDrop', e, props.column.id, lastIndex)
}

defineExpose({
  getParagraphRef: (id: string) => paragraphRefs.value.get(id),
})
</script>

<template>
  <div
    class="column"
    :class="{ 'column--active': isActive }"
    :style="columnStyle"
    :data-column-id="column.id"
    @click="handleColumnClick"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <div class="column__content">
      <Paragraph
        v-for="(paragraph, index) in column.paragraphs"
        :key="paragraph.id"
        :ref="(el) => setParagraphRef(el, paragraph.id)"
        :paragraph="paragraph"
        :column-id="column.id"
        :index="index"
        :is-active="activeParagraphId === paragraph.id && activeColumnId === column.id"
        :is-drag-over="dragOverIndex === index && draggingParagraphId !== paragraph.id"
        :is-dragging="draggingParagraphId === paragraph.id"
        @input="(content) => handleParagraphInput(paragraph.id, content)"
        @focus="handleParagraphFocus(paragraph.id)"
        @drag-start="(e, idx) => handleParagraphDragStart(e, idx)"
        @drag-end="handleParagraphDragEnd"
        @drag-over="(e, idx) => handleParagraphDragOver(e, idx)"
        @drop="(e, idx) => handleParagraphDrop(e, idx)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.column {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  transition: all var(--transition-fast);
  position: relative;

  &--active {
    .column__content {
      border-color: var(--color-border-accent);
    }
  }

  &__content {
    flex: 1;
    padding: var(--spacing-6) var(--spacing-5);
    overflow-y: auto;
    background-color: var(--color-bg-panel);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-lg);
    min-height: 0;
    transition: border-color var(--transition-fast);
  }
}
</style>
