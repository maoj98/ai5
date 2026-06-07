<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import DragHandle from './DragHandle.vue'
import type { Paragraph as ParagraphType } from '@/types/document'
import type { FormatConfig } from '@/types/format'
import { formatToInlineStyle } from '@/utils/richText'
import { debounce } from '@/utils/debounce'
import { saveSelection } from '@/utils/selection'

const props = defineProps<{
  paragraph: ParagraphType
  columnId: string
  index: number
  isActive: boolean
  isDragOver: boolean
  isDragging: boolean
}>()

const emit = defineEmits<{
  input: [content: string]
  focus: []
  dragStart: [e: DragEvent, index: number]
  dragEnd: [e: DragEvent]
  dragOver: [e: DragEvent, index: number]
  drop: [e: DragEvent, index: number]
}>()

const contentRef = ref<HTMLElement | null>(null)
const isHovered = ref(false)
const isFocused = ref(false)

const paragraphClasses = computed(() => ({
  paragraph: true,
  'paragraph--active': props.isActive,
  'paragraph--dragging': props.isDragging,
  'paragraph--drag-over': props.isDragOver,
  'paragraph--hovered': isHovered.value,
  [`paragraph--${props.paragraph.type}`]: true,
}))

const contentStyle = computed(() => {
  const baseStyle = formatToInlineStyle(props.paragraph.format)
  
  const typeStyles: Record<string, string> = {
    heading: `font-family: var(--font-family-display);`,
    quote: `border-left: 4px solid var(--color-accent); padding-left: 16px; margin-left: 0;`,
    code: `font-family: var(--font-family-mono); background-color: var(--color-bg-secondary); color: var(--color-text-inverse); padding: 16px; border-radius: var(--radius-md); white-space: pre-wrap;`,
    list: ``,
    text: ``,
  }

  return baseStyle + (typeStyles[props.paragraph.type] || '')
})

const tagName = computed(() => {
  switch (props.paragraph.type) {
    case 'heading':
      return `h${props.paragraph.level || 1}`
    case 'quote':
      return 'blockquote'
    case 'code':
      return 'pre'
    case 'list':
      return 'ul'
    default:
      return 'p'
  }
})

const displayContent = computed(() => {
  if (props.paragraph.type === 'list') {
    return props.paragraph.content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => `<li>${line.replace(/^[•\-*]\s*/, '')}</li>`)
      .join('')
  }
  return props.paragraph.content
})

const handleInput = debounce(() => {
  if (!contentRef.value) return
  
  let content = ''
  if (props.paragraph.type === 'list') {
    const lis = contentRef.value.querySelectorAll('li')
    content = Array.from(lis)
      .map((li) => `• ${li.textContent || ''}`)
      .join('\n')
  } else {
    content = contentRef.value.innerText || ''
  }
  
  emit('input', content)
}, 100)

function handleFocus() {
  isFocused.value = true
  emit('focus')
}

function handleBlur() {
  isFocused.value = false
}

function handleParagraphClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.paragraph__content')) {
    contentRef.value?.focus()
  }
}

function handleDragStart(e: DragEvent) {
  if (!e.dataTransfer) return
  
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', JSON.stringify({
    columnId: props.columnId,
    index: props.index,
    paragraphId: props.paragraph.id,
  }))
  
  setTimeout(() => {
    isDraggingInternal.value = true
  }, 0)
  
  emit('dragStart', e, props.index)
}

function handleDragEnd(e: DragEvent) {
  isDraggingInternal.value = false
  emit('dragEnd', e)
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
  emit('dragOver', e, props.index)
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  emit('drop', e, props.index)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    if (props.paragraph.type === 'code') {
      e.preventDefault()
      window.document.execCommand('insertLineBreak')
    }
  }
  
  if (e.key === 'Backspace' && contentRef.value?.innerText === '') {
    e.preventDefault()
  }
  
  if (props.paragraph.type === 'code') {
    return
  }
  
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault()
    window.document.execCommand('bold')
  }
  
  if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
    e.preventDefault()
    window.document.execCommand('italic')
  }
  
  if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
    e.preventDefault()
    window.document.execCommand('underline')
  }
}

const isDraggingInternal = ref(false)

watch(
  () => props.paragraph.content,
  async (newContent) => {
    if (!contentRef.value || window.document.activeElement === contentRef.value) return
    
    await nextTick()
    if (props.paragraph.type === 'list') {
      contentRef.value.innerHTML = displayContent.value
    } else {
      contentRef.value.innerText = newContent
    }
  }
)

watch(
  () => props.paragraph.type,
  async () => {
    if (!contentRef.value) return
    
    await nextTick()
    const textContent = contentRef.value.innerText || ''
    if (props.paragraph.type === 'list') {
      contentRef.value.innerHTML = displayContent.value
    } else {
      contentRef.value.innerHTML = textContent
    }
  }
)

onMounted(() => {
  if (contentRef.value && props.paragraph.type === 'list') {
    contentRef.value.innerHTML = displayContent.value
  }
})

defineExpose({
  focus: () => contentRef.value?.focus(),
  getElement: () => contentRef.value,
})
</script>

<template>
  <div
    :class="paragraphClasses"
    :data-paragraph-id="paragraph.id"
    :data-column-id="columnId"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @dragover="handleDragOver"
    @drop="handleDrop"
    @click="handleParagraphClick"
  >
    <DragHandle
      :draggable="isHovered || isActive"
      @drag-start="handleDragStart"
      @drag-end="handleDragEnd"
    />
    
    <component
      :is="tagName"
      :key="paragraph.type"
      ref="contentRef"
      class="paragraph__content"
      :style="contentStyle"
      contenteditable="true"
      :data-placeholder="getPlaceholder(paragraph.type)"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown="handleKeyDown"
      v-html="paragraph.type === 'list' ? displayContent : paragraph.content"
    />
    
    <div v-if="isDragOver" class="paragraph__drop-indicator" />
  </div>
</template>

<script lang="ts">
function getPlaceholder(type: string): string {
  const placeholders: Record<string, string> = {
    text: '输入正文内容...',
    heading: '输入标题...',
    list: '输入列表项...',
    quote: '输入引用内容...',
    code: '输入代码...',
  }
  return placeholders[type] || '输入内容...'
}
</script>

<style lang="scss" scoped>
.paragraph {
  display: flex;
  align-items: flex-start;
  position: relative;
  padding: var(--spacing-1) 0;
  transition: all var(--transition-fast);

  &--hovered {
    background-color: var(--color-bg-hover);
    border-radius: var(--radius-sm);
  }

  &--active {
    background-color: var(--color-accent-light);
    border-radius: var(--radius-sm);
  }

  &--dragging {
    opacity: 0.4;
  }

  &--drag-over {
    &::before {
      content: '';
      position: absolute;
      left: var(--width-drag-handle);
      right: 0;
      top: -2px;
      height: 3px;
      background-color: var(--color-accent);
      border-radius: 2px;
    }
  }

  &__content {
    flex: 1;
    min-height: 24px;
    outline: none;
    word-break: break-word;
    overflow-wrap: break-word;
  }

  &__drop-indicator {
    position: absolute;
    left: var(--width-drag-handle);
    right: 0;
    top: -2px;
    height: 3px;
    background-color: var(--color-accent);
    border-radius: 2px;
    pointer-events: none;
  }

  &--heading {
    .paragraph__content {
      margin: 0.5em 0;
    }
  }

  &--quote {
    .paragraph__content {
      font-style: italic;
      color: var(--color-text-secondary);
    }
  }

  &--code {
    .paragraph__content {
      font-family: var(--font-family-mono);
      font-size: 14px;
    }
  }

  &--list {
    .paragraph__content {
      padding-left: 0;
      
      :deep(li) {
        margin-left: 1.5em;
        list-style-type: disc;
      }
    }
  }
}
</style>
