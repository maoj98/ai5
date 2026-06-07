<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Column from './Column.vue'
import ResizeHandle from './ResizeHandle.vue'
import { useEditor } from '@/composables/useEditor'
import { useHistory } from '@/composables/useHistory'
import type { Document } from '@/types/document'

const {
  document,
  activeColumnId,
  wordCount,
  paragraphCount,
  handleParagraphInput,
  handleParagraphFormat,
  handleAddParagraph,
  handleRemoveParagraph,
  handleMoveParagraph,
  handleSelectParagraph,
  handleSelectColumn,
  handleUpdateColumnWidth,
} = useEditor()

const { recordHistory, setupKeyboardShortcuts, saveToLocalStorage } = useHistory()

const columnRefs = ref<Map<string, InstanceType<typeof Column>>>(new Map())
const draggingParagraphId = ref<string | null>(null)
const draggingSourceColumnId = ref<string | null>(null)
const draggingSourceIndex = ref<number>(-1)
const dragOverColumnId = ref<string | null>(null)
const dragOverIndex = ref<number | null>(null)

let autoSaveTimer: ReturnType<typeof setInterval> | null = null

function setColumnRef(el: any, columnId: string) {
  if (el) {
    columnRefs.value.set(columnId, el)
  } else {
    columnRefs.value.delete(columnId)
  }
}

function handleParagraphInputHandler(columnId: string, paragraphId: string, content: string) {
  handleParagraphInput(columnId, paragraphId, content)
}

function handleParagraphFocusHandler(columnId: string, paragraphId: string) {
  handleSelectParagraph(columnId, paragraphId)
}

function handleParagraphDragStart(e: DragEvent, columnId: string, index: number) {
  const column = document.value.columns.find((c) => c.id === columnId)
  if (!column) return

  const paragraph = column.paragraphs[index]
  if (!paragraph) return

  draggingParagraphId.value = paragraph.id
  draggingSourceColumnId.value = columnId
  draggingSourceIndex.value = index

  recordHistory('移动段落', true)
}

function handleParagraphDragEnd() {
  draggingParagraphId.value = null
  draggingSourceColumnId.value = null
  draggingSourceIndex.value = -1
  dragOverColumnId.value = null
  dragOverIndex.value = null
}

function handleParagraphDragOver(e: DragEvent, columnId: string, index: number) {
  dragOverColumnId.value = columnId
  dragOverIndex.value = index
}

function handleParagraphDrop(e: DragEvent, targetColumnId: string, targetIndex: number) {
  if (!draggingSourceColumnId.value || draggingSourceIndex.value < 0) return

  handleMoveParagraph(
    draggingSourceColumnId.value,
    draggingSourceIndex.value,
    targetColumnId,
    targetIndex
  )

  handleParagraphDragEnd()
}

function handleResizeStart(index: number) {
  // 可以添加拖拽开始的视觉反馈
}

function handleResize(index: number, width: number) {
  handleUpdateColumnWidth(index, width)
}

function handleResizeEnd(index: number) {
  recordHistory('调整栏宽', true)
}

function handleTitleInput(e: Event) {
  const target = e.target as HTMLInputElement
  document.value.title = target.value
  recordHistory('修改标题')
}

function autoSave() {
  saveToLocalStorage()
}

onMounted(() => {
  const cleanup = setupKeyboardShortcuts()
  
  autoSaveTimer = setInterval(autoSave, 30000)

  window.addEventListener('beforeunload', autoSave)

  return () => {
    cleanup()
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
    }
    window.removeEventListener('beforeunload', autoSave)
  }
})
</script>

<template>
  <div class="column-editor">
    <div class="column-editor__header">
      <input
        type="text"
        class="column-editor__title"
        :value="document.title"
        placeholder="输入文档标题..."
        @input="handleTitleInput"
      />
    </div>

    <div class="columns-container">
      <template v-for="(column, index) in document.columns" :key="column.id">
        <Column
          :ref="(el) => setColumnRef(el, column.id)"
          :column="column"
          :column-index="index"
          :is-active="activeColumnId === column.id"
          :dragging-paragraph-id="draggingParagraphId"
          :drag-over-index="dragOverColumnId === column.id ? dragOverIndex : null"
          @paragraph-input="handleParagraphInputHandler"
          @paragraph-focus="handleParagraphFocusHandler"
          @paragraph-drag-start="handleParagraphDragStart"
          @paragraph-drag-end="handleParagraphDragEnd"
          @paragraph-drag-over="handleParagraphDragOver"
          @paragraph-drop="handleParagraphDrop"
          @click="handleSelectColumn(column.id)"
        />
        
        <ResizeHandle
          v-if="index < document.columns.length - 1"
          :column-index="index"
          @resize-start="handleResizeStart"
          @resize="handleResize"
          @resize-end="handleResizeEnd"
        />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.column-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: var(--spacing-6);
  gap: var(--spacing-6);
  background-color: var(--color-bg-editor);

  &__header {
    flex-shrink: 0;
  }

  &__title {
    width: 100%;
    padding: var(--spacing-3) var(--spacing-4);
    font-size: var(--font-size-2xl);
    font-weight: 600;
    font-family: var(--font-family-display);
    color: var(--color-text-primary);
    background-color: var(--color-bg-panel);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-md);
    outline: none;
    transition: border-color var(--transition-fast);

    &:focus {
      border-color: var(--color-accent);
    }

    &::placeholder {
      color: var(--color-text-muted);
    }
  }
}

.columns-container {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: var(--spacing-4);
  align-items: stretch;
}
</style>
