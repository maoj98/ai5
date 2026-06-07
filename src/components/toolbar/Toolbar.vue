<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Undo2,
  Redo2,
  Columns,
  Columns2,
  Columns3,
  Download,
  Upload,
  Settings,
  FileJson,
  FileText,
  Globe,
} from 'lucide-vue-next'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarGroup from './ToolbarGroup.vue'
import { useHistory } from '@/composables/useHistory'
import { useEditor } from '@/composables/useEditor'
import { useEditorStore } from '@/stores/editor'
import { useFormatStore } from '@/stores/format'
import { ImportExportService } from '@/services/ImportExportService'
import type { Document } from '@/types/document'

const { canUndo, canRedo, undo, redo } = useHistory()
const { document, handleSetColumnCount, activeParagraphId, activeColumnId, handleParagraphType } = useEditor()
const editorStore = useEditorStore()
const formatStore = useFormatStore()

const showColumnMenu = ref(false)
const showExportMenu = ref(false)
const showImportMenu = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const activeFormat = ref<Record<string, boolean>>({
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  alignLeft: true,
  alignCenter: false,
  alignRight: false,
  alignJustify: false,
})

const columnCount = computed(() => document.value.columnCount)

function getActiveParagraphFromDOM(): { columnId: string; paragraphId: string } | null {
  const activeEl = window.document.activeElement as HTMLElement
  const paragraphEl = activeEl?.closest('[data-paragraph-id]')
  const columnEl = activeEl?.closest('[data-column-id]')
  
  if (paragraphEl && columnEl) {
    const paragraphId = paragraphEl.getAttribute('data-paragraph-id')
    const columnId = columnEl.getAttribute('data-column-id')
    if (paragraphId && columnId) {
      return { columnId, paragraphId }
    }
  }
  return null
}

function getActiveParagraphType(): string | null {
  const active = getActiveParagraphFromDOM()
  if (active) {
    const paragraph = editorStore.getParagraphById(active.columnId, active.paragraphId)
    return paragraph?.type || null
  }
  if (activeColumnId.value && activeParagraphId.value) {
    const paragraph = editorStore.getParagraphById(activeColumnId.value, activeParagraphId.value)
    return paragraph?.type || null
  }
  return null
}

const isCodeMode = computed(() => {
  return getActiveParagraphType() === 'code'
})

function handleUndo() {
  undo()
}

function handleRedo() {
  redo()
}

function handleBold() {
  const type = getActiveParagraphType()
  if (!type || type === 'code') return
  activeFormat.value.bold = !activeFormat.value.bold
  window.document.execCommand('bold')
}

function handleItalic() {
  const type = getActiveParagraphType()
  if (!type || type === 'code') return
  activeFormat.value.italic = !activeFormat.value.italic
  window.document.execCommand('italic')
}

function handleUnderline() {
  const type = getActiveParagraphType()
  if (!type || type === 'code') return
  activeFormat.value.underline = !activeFormat.value.underline
  window.document.execCommand('underline')
}

function handleStrikethrough() {
  const type = getActiveParagraphType()
  if (!type || type === 'code') return
  activeFormat.value.strikethrough = !activeFormat.value.strikethrough
  window.document.execCommand('strikeThrough')
}

function handleHeading(level: 1 | 2 | 3) {
  const active = getActiveParagraphFromDOM()
  if (active) {
    handleParagraphType(active.columnId, active.paragraphId, 'heading', level)
  } else if (activeColumnId.value && activeParagraphId.value) {
    handleParagraphType(activeColumnId.value, activeParagraphId.value, 'heading', level)
  } else {
    window.document.execCommand('formatBlock', false, `<h${level}>`)
  }
}

function handleParagraph() {
  if (activeColumnId.value && activeParagraphId.value) {
    handleParagraphType(activeColumnId.value, activeParagraphId.value, 'text')
  } else {
    const active = getActiveParagraphFromDOM()
    if (active) {
      handleParagraphType(active.columnId, active.paragraphId, 'text')
    } else {
      window.document.execCommand('formatBlock', false, '<p>')
    }
  }
}

function handleList() {
  window.document.execCommand('insertUnorderedList')
}

function handleOrderedList() {
  window.document.execCommand('insertOrderedList')
}

function handleQuote() {
  if (activeColumnId.value && activeParagraphId.value) {
    handleParagraphType(activeColumnId.value, activeParagraphId.value, 'quote')
  } else {
    const active = getActiveParagraphFromDOM()
    if (active) {
      handleParagraphType(active.columnId, active.paragraphId, 'quote')
    } else {
      window.document.execCommand('formatBlock', false, '<blockquote>')
    }
  }
}

function resetFormatStates() {
  activeFormat.value.bold = false
  activeFormat.value.italic = false
  activeFormat.value.underline = false
  activeFormat.value.strikethrough = false
}

function clearAllFormatting() {
  window.document.execCommand('removeFormat')
  window.document.execCommand('bold', false, 'false')
  window.document.execCommand('italic', false, 'false')
  window.document.execCommand('underline', false, 'false')
  window.document.execCommand('strikeThrough', false, 'false')
  resetFormatStates()
}

function handleCode() {
  clearAllFormatting()
  
  const active = getActiveParagraphFromDOM()
  if (active) {
    handleParagraphType(active.columnId, active.paragraphId, 'code')
  } else if (activeColumnId.value && activeParagraphId.value) {
    handleParagraphType(activeColumnId.value, activeParagraphId.value, 'code')
  } else {
    window.document.execCommand('formatBlock', false, '<pre>')
  }
}

function handleAlign(align: 'left' | 'center' | 'right' | 'justify') {
  const type = getActiveParagraphType()
  if (!type || type === 'code') return
  activeFormat.value.alignLeft = align === 'left'
  activeFormat.value.alignCenter = align === 'center'
  activeFormat.value.alignRight = align === 'right'
  activeFormat.value.alignJustify = align === 'justify'

  const commands: Record<string, string> = {
    left: 'justifyLeft',
    center: 'justifyCenter',
    right: 'justifyRight',
    justify: 'justifyFull',
  }
  window.document.execCommand(commands[align])
}

watch(isCodeMode, (newVal) => {
  if (newVal) {
    resetFormatStates()
  }
})

function handleColumns(count: 1 | 2 | 3) {
  handleSetColumnCount(count)
  showColumnMenu.value = false
}

function handleExport(format: 'json' | 'markdown' | 'html') {
  const doc = document.value
  const title = doc.title || '未命名文档'

  let content: string
  let filename: string
  let mimeType: string

  switch (format) {
    case 'json':
      content = ImportExportService.exportToJSON(doc)
      filename = `${title}.json`
      mimeType = 'application/json'
      break
    case 'markdown':
      content = ImportExportService.exportToMarkdown(doc)
      filename = `${title}.md`
      mimeType = 'text/markdown'
      break
    case 'html':
      content = ImportExportService.exportToHtml(doc)
      filename = `${title}.html`
      mimeType = 'text/html'
      break
  }

  ImportExportService.downloadFile(content, filename, mimeType)
  showExportMenu.value = false
}

function handleImportClick() {
  fileInputRef.value?.click()
}

async function handleImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const content = await ImportExportService.readFile(file)
    let importedDoc: Document

    if (file.name.endsWith('.json')) {
      importedDoc = ImportExportService.importFromJSON(content)
    } else if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
      importedDoc = ImportExportService.importFromMarkdown(content, columnCount.value as 1 | 2 | 3)
    } else {
      alert('不支持的文件格式')
      return
    }

    editorStore.setDocument(importedDoc)
  } catch (e) {
    console.error('Import failed:', e)
    alert('导入失败，请检查文件格式')
  }

  input.value = ''
  showImportMenu.value = false
}

function toggleFormatPanel() {
  formatStore.togglePanel()
}

function closeMenus() {
  showColumnMenu.value = false
  showExportMenu.value = false
  showImportMenu.value = false
}
</script>

<template>
  <div class="toolbar" @click.self="closeMenus">
    <ToolbarGroup label="历史">
      <ToolbarButton title="撤销 (Ctrl+Z)" :disabled="!canUndo" @click="handleUndo">
        <Undo2 :size="20" />
      </ToolbarButton>
      <ToolbarButton title="重做 (Ctrl+Y)" :disabled="!canRedo" @click="handleRedo">
        <Redo2 :size="20" />
      </ToolbarButton>
    </ToolbarGroup>

    <ToolbarGroup label="标题">
      <ToolbarButton title="正文" @click="handleParagraph">
        <FileText :size="20" />
      </ToolbarButton>
      <ToolbarButton title="标题一" @click="handleHeading(1)">
        <Heading1 :size="20" />
      </ToolbarButton>
      <ToolbarButton title="标题二" @click="handleHeading(2)">
        <Heading2 :size="20" />
      </ToolbarButton>
      <ToolbarButton title="标题三" @click="handleHeading(3)">
        <Heading3 :size="20" />
      </ToolbarButton>
    </ToolbarGroup>

    <ToolbarGroup label="格式">
      <ToolbarButton title="加粗 (Ctrl+B)" :active="activeFormat.bold" :disabled="isCodeMode" @click="handleBold">
        <Bold :size="20" />
      </ToolbarButton>
      <ToolbarButton title="斜体 (Ctrl+I)" :active="activeFormat.italic" :disabled="isCodeMode" @click="handleItalic">
        <Italic :size="20" />
      </ToolbarButton>
      <ToolbarButton title="下划线 (Ctrl+U)" :active="activeFormat.underline" :disabled="isCodeMode" @click="handleUnderline">
        <Underline :size="20" />
      </ToolbarButton>
      <ToolbarButton title="删除线" :active="activeFormat.strikethrough" :disabled="isCodeMode" @click="handleStrikethrough">
        <Strikethrough :size="20" />
      </ToolbarButton>
    </ToolbarGroup>

    <ToolbarGroup label="列表">
      <ToolbarButton title="无序列表" @click="handleList">
        <List :size="20" />
      </ToolbarButton>
      <ToolbarButton title="有序列表" @click="handleOrderedList">
        <ListOrdered :size="20" />
      </ToolbarButton>
      <ToolbarButton title="引用" @click="handleQuote">
        <Quote :size="20" />
      </ToolbarButton>
      <ToolbarButton title="代码块" @click="handleCode">
        <Code :size="20" />
      </ToolbarButton>
    </ToolbarGroup>

    <ToolbarGroup label="对齐">
      <ToolbarButton title="左对齐" :active="activeFormat.alignLeft" :disabled="isCodeMode" @click="handleAlign('left')">
        <AlignLeft :size="20" />
      </ToolbarButton>
      <ToolbarButton title="居中对齐" :active="activeFormat.alignCenter" :disabled="isCodeMode" @click="handleAlign('center')">
        <AlignCenter :size="20" />
      </ToolbarButton>
      <ToolbarButton title="右对齐" :active="activeFormat.alignRight" :disabled="isCodeMode" @click="handleAlign('right')">
        <AlignRight :size="20" />
      </ToolbarButton>
      <ToolbarButton title="两端对齐" :active="activeFormat.alignJustify" :disabled="isCodeMode" @click="handleAlign('justify')">
        <AlignJustify :size="20" />
      </ToolbarButton>
    </ToolbarGroup>

    <div class="toolbar-spacer" />

    <ToolbarGroup label="分栏">
      <div class="toolbar-menu">
        <ToolbarButton title="分栏设置" @click="showColumnMenu = !showColumnMenu; closeMenus()">
          <Columns :size="20" />
        </ToolbarButton>
        <div v-if="showColumnMenu" class="toolbar-menu__dropdown">
          <button
            class="toolbar-menu__item"
            :class="{ active: columnCount === 1 }"
            @click="handleColumns(1)"
          >
            <Columns :size="16" />
            <span>单栏</span>
          </button>
          <button
            class="toolbar-menu__item"
            :class="{ active: columnCount === 2 }"
            @click="handleColumns(2)"
          >
            <Columns2 :size="16" />
            <span>双栏</span>
          </button>
          <button
            class="toolbar-menu__item"
            :class="{ active: columnCount === 3 }"
            @click="handleColumns(3)"
          >
            <Columns3 :size="16" />
            <span>三栏</span>
          </button>
        </div>
      </div>
    </ToolbarGroup>

    <ToolbarGroup label="导入导出">
      <div class="toolbar-menu">
        <ToolbarButton title="导入" @click="showImportMenu = !showImportMenu; closeMenus()">
          <Upload :size="20" />
        </ToolbarButton>
        <div v-if="showImportMenu" class="toolbar-menu__dropdown">
          <button class="toolbar-menu__item" @click="handleImportClick">
            <FileJson :size="16" />
            <span>导入 JSON</span>
          </button>
          <button class="toolbar-menu__item" @click="handleImportClick">
            <FileText :size="16" />
            <span>导入 Markdown</span>
          </button>
        </div>
      </div>

      <div class="toolbar-menu">
        <ToolbarButton title="导出" @click="showExportMenu = !showExportMenu; closeMenus()">
          <Download :size="20" />
        </ToolbarButton>
        <div v-if="showExportMenu" class="toolbar-menu__dropdown">
          <button class="toolbar-menu__item" @click="handleExport('json')">
            <FileJson :size="16" />
            <span>导出 JSON</span>
          </button>
          <button class="toolbar-menu__item" @click="handleExport('markdown')">
            <FileText :size="16" />
            <span>导出 Markdown</span>
          </button>
          <button class="toolbar-menu__item" @click="handleExport('html')">
            <Globe :size="16" />
            <span>导出 HTML</span>
          </button>
        </div>
      </div>
    </ToolbarGroup>

    <ToolbarGroup>
      <ToolbarButton title="格式设置" @click="toggleFormatPanel">
        <Settings :size="20" />
      </ToolbarButton>
    </ToolbarGroup>

    <input
      ref="fileInputRef"
      type="file"
      accept=".json,.md,.markdown"
      style="display: none"
      @change="handleImportFile"
    />
  </div>
</template>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  align-items: center;
  height: var(--height-toolbar);
  padding: 0 var(--spacing-4);
  background-color: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border-light);
  overflow-x: auto;
  overflow-y: hidden;

  &-spacer {
    flex: 1;
  }

  &-menu {
    position: relative;

    &__dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: var(--spacing-1);
      background-color: var(--color-bg-secondary);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      padding: var(--spacing-2);
      min-width: 140px;
      z-index: var(--z-index-dropdown);
      animation: slideDown var(--transition-fast) ease-out;
    }

    &__item {
      display: flex;
      align-items: center;
      gap: var(--spacing-2);
      width: 100%;
      padding: var(--spacing-2) var(--spacing-3);
      border-radius: var(--radius-sm);
      color: var(--color-text-inverse);
      font-size: var(--font-size-sm);
      transition: background-color var(--transition-fast);

      &:hover {
        background-color: var(--color-bg-hover);
      }

      &.active {
        background-color: var(--color-accent);
        color: var(--color-bg-primary);
      }
    }
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
