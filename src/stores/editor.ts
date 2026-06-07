import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Document, Column, Paragraph, SelectionState, DragData } from '@/types/document'
import type { FormatConfig } from '@/types/format'
import { defaultFormatConfig } from '@/types/format'
import { generateId } from '@/utils/dom'
import { createEmptyParagraph } from '@/utils/richText'

const headingStylePresets: Record<number, Partial<FormatConfig>> = {
  1: {
    fontSize: 32,
    lineHeight: 1.3,
  },
  2: {
    fontSize: 24,
    lineHeight: 1.4,
  },
  3: {
    fontSize: 20,
    lineHeight: 1.4,
  },
}

const codeStylePreset: Partial<FormatConfig> = {
  fontFamily: 'JetBrains Mono, Consolas, monospace',
  fontSize: 14,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  color: '#e83e8c',
  lineHeight: 1.6,
}

function createInitialDocument(): Document {
  const column1Id = generateId()
  const column2Id = generateId()
  
  return {
    id: generateId(),
    title: '未命名文档',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    columnCount: 2,
    columnWidths: [50, 50],
    columns: [
      {
        id: column1Id,
        width: 50,
        paragraphs: [
          {
            id: generateId(),
            type: 'heading',
            level: 1,
            content: '多栏在线文档编辑器',
            format: {
              ...defaultFormatConfig,
              fontSize: 32,
              fontWeight: 'bold',
              lineHeight: 1.3,
            },
          },
          {
            id: generateId(),
            type: 'text',
            content: '欢迎使用双栏/多栏在线文档编辑器。这是一个功能强大的文档编辑工具，支持富文本编辑、分栏拖拽调整宽度、段落拖拽排序等功能。',
            format: { ...defaultFormatConfig },
          },
          {
            id: generateId(),
            type: 'text',
            content: '左侧栏主要用于正文内容的编辑，您可以在这里输入和编辑文本内容。编辑器支持多种文本格式设置，包括字体、字号、颜色、行高等。',
            format: { ...defaultFormatConfig },
          },
          createEmptyParagraph(),
        ],
      },
      {
        id: column2Id,
        width: 50,
        paragraphs: [
          {
            id: generateId(),
            type: 'heading',
            level: 2,
            content: '功能特性',
            format: {
              ...defaultFormatConfig,
              fontSize: 24,
              fontWeight: 'bold',
              lineHeight: 1.4,
            },
          },
          {
            id: generateId(),
            type: 'list',
            content: '• 富文本编辑：支持加粗、斜体、下划线等格式\n• 分栏拖拽：拖拽分隔线调整栏宽比例\n• 段落排序：拖拽手柄调整段落顺序\n• 历史记录：撤销/重做操作，自动保存版本\n• 导入导出：支持 Markdown、HTML、JSON 格式',
            format: { ...defaultFormatConfig },
          },
          {
            id: generateId(),
            type: 'quote',
            content: '好的编辑器应该让用户专注于内容创作，而不是工具本身。',
            format: {
              ...defaultFormatConfig,
              fontStyle: 'italic',
              color: '#666666',
              textIndent: 24,
            },
          },
          {
            id: generateId(),
            type: 'code',
            content: '// 示例代码\nconst editor = new MultiColumnEditor();\neditor.setColumnCount(3);\neditor.exportToMarkdown();',
            format: {
              ...defaultFormatConfig,
              fontFamily: 'JetBrains Mono, Consolas, monospace',
              fontSize: 14,
              color: '#e83e8c',
            },
          },
        ],
      },
    ],
    globalFormat: { ...defaultFormatConfig },
  }
}

export const useEditorStore = defineStore('editor', () => {
  const document = ref<Document>(createInitialDocument())
  const activeColumnId = ref<string>('')
  const activeParagraphId = ref<string>('')
  const selection = ref<SelectionState | null>(null)
  const isDragging = ref(false)
  const dragData = ref<DragData | null>(null)
  const dropTarget = ref<{ columnId: string; index: number } | null>(null)
  const isResizing = ref(false)
  const resizingColumnIndex = ref<number>(-1)
  const wordCount = computed(() => {
    let count = 0
    document.value.columns.forEach((column) => {
      column.paragraphs.forEach((paragraph) => {
        count += paragraph.content.replace(/\s/g, '').length
      })
    })
    return count
  })

  const paragraphCount = computed(() => {
    let count = 0
    document.value.columns.forEach((column) => {
      count += column.paragraphs.length
    })
    return count
  })

  function getColumnById(columnId: string): Column | undefined {
    return document.value.columns.find((col) => col.id === columnId)
  }

  function getParagraphById(columnId: string, paragraphId: string): Paragraph | undefined {
    const column = getColumnById(columnId)
    return column?.paragraphs.find((p) => p.id === paragraphId)
  }

  function getParagraphIndex(columnId: string, paragraphId: string): number {
    const column = getColumnById(columnId)
    if (!column) return -1
    return column.paragraphs.findIndex((p) => p.id === paragraphId)
  }

  function setActiveColumn(columnId: string) {
    activeColumnId.value = columnId
  }

  function setActiveParagraph(columnId: string, paragraphId: string) {
    activeColumnId.value = columnId
    activeParagraphId.value = paragraphId
  }

  function setSelection(sel: SelectionState | null) {
    selection.value = sel
  }

  function updateParagraphContent(
    columnId: string,
    paragraphId: string,
    content: string
  ) {
    const paragraph = getParagraphById(columnId, paragraphId)
    if (paragraph) {
      paragraph.content = content
      document.value.updatedAt = Date.now()
    }
  }

  function updateParagraphFormat(
    columnId: string,
    paragraphId: string,
    format: Partial<FormatConfig>
  ) {
    const paragraph = getParagraphById(columnId, paragraphId)
    if (paragraph) {
      paragraph.format = { ...paragraph.format, ...format }
      document.value.updatedAt = Date.now()
    }
  }

  function updateParagraphType(
    columnId: string,
    paragraphId: string,
    type: Paragraph['type'],
    level?: number
  ) {
    const paragraph = getParagraphById(columnId, paragraphId)
    if (paragraph) {
      paragraph.type = type
      if (type === 'heading') {
        const headingLevel = level || 1
        paragraph.level = headingLevel
        const stylePreset = headingStylePresets[headingLevel]
        if (stylePreset) {
          paragraph.format = { ...paragraph.format, ...stylePreset }
        }
      } else if (type === 'code') {
        delete paragraph.level
        paragraph.format = { ...defaultFormatConfig, ...codeStylePreset }
      } else {
        delete paragraph.level
        const inlineFormat = {
          fontWeight: paragraph.format.fontWeight,
          fontStyle: paragraph.format.fontStyle,
          textDecoration: paragraph.format.textDecoration,
          color: paragraph.format.color,
        }
        paragraph.format = { ...defaultFormatConfig, ...inlineFormat }
        if (paragraph.format.textDecoration === 'none') {
          delete (paragraph.format as Partial<FormatConfig>).textDecoration
        }
      }
      document.value.updatedAt = Date.now()
    }
  }

  function addParagraph(
    columnId: string,
    afterParagraphId: string | null,
    paragraph?: Paragraph
  ): Paragraph {
    const column = getColumnById(columnId)
    if (!column) throw new Error('Column not found')

    const newParagraph = paragraph || createEmptyParagraph()

    if (afterParagraphId) {
      const index = column.paragraphs.findIndex((p) => p.id === afterParagraphId)
      if (index !== -1) {
        column.paragraphs.splice(index + 1, 0, newParagraph)
      } else {
        column.paragraphs.push(newParagraph)
      }
    } else {
      column.paragraphs.push(newParagraph)
    }

    document.value.updatedAt = Date.now()
    return newParagraph
  }

  function removeParagraph(columnId: string, paragraphId: string) {
    const column = getColumnById(columnId)
    if (!column) return

    const index = column.paragraphs.findIndex((p) => p.id === paragraphId)
    if (index !== -1) {
      column.paragraphs.splice(index, 1)
      document.value.updatedAt = Date.now()

      if (activeParagraphId.value === paragraphId) {
        activeParagraphId.value = ''
      }
    }
  }

  function moveParagraph(
    sourceColumnId: string,
    sourceIndex: number,
    targetColumnId: string,
    targetIndex: number
  ) {
    const sourceColumn = getColumnById(sourceColumnId)
    const targetColumn = getColumnById(targetColumnId)

    if (!sourceColumn || !targetColumn) return

    const [movedParagraph] = sourceColumn.paragraphs.splice(sourceIndex, 1)
    
    const adjustedTargetIndex = sourceColumnId === targetColumnId && sourceIndex < targetIndex
      ? targetIndex - 1
      : targetIndex

    targetColumn.paragraphs.splice(adjustedTargetIndex, 0, movedParagraph)
    document.value.updatedAt = Date.now()
  }

  function setColumnCount(count: 1 | 2 | 3) {
    const currentCount = document.value.columns.length
    document.value.columnCount = count

    if (count > currentCount) {
      for (let i = currentCount; i < count; i++) {
        document.value.columns.push({
          id: generateId(),
          width: 100 / count,
          paragraphs: [createEmptyParagraph()],
        })
      }
    } else if (count < currentCount) {
      const removedColumns = document.value.columns.splice(count)
      const firstColumn = document.value.columns[0]
      removedColumns.forEach((col) => {
        firstColumn.paragraphs.push(...col.paragraphs)
      })
    }

    const newWidth = 100 / count
    document.value.columns.forEach((col) => {
      col.width = newWidth
    })
    document.value.columnWidths = document.value.columns.map((col) => col.width)
    document.value.updatedAt = Date.now()
  }

  function updateColumnWidth(columnIndex: number, width: number) {
    if (columnIndex < 0 || columnIndex >= document.value.columns.length) return

    const column = document.value.columns[columnIndex]
    const nextColumn = document.value.columns[columnIndex + 1]

    if (!column || !nextColumn) return

    const totalWidth = column.width + nextColumn.width
    const clampedWidth = Math.max(20, Math.min(80, width))
    const nextWidth = totalWidth - clampedWidth

    if (nextWidth < 20) return

    column.width = clampedWidth
    nextColumn.width = nextWidth
    document.value.columnWidths = document.value.columns.map((col) => col.width)
    document.value.updatedAt = Date.now()
  }

  function setDragging(value: boolean) {
    isDragging.value = value
  }

  function setDragData(data: DragData | null) {
    dragData.value = data
  }

  function setDropTarget(target: { columnId: string; index: number } | null) {
    dropTarget.value = target
  }

  function setResizing(value: boolean) {
    isResizing.value = value
  }

  function setResizingColumnIndex(index: number) {
    resizingColumnIndex.value = index
  }

  function updateTitle(title: string) {
    document.value.title = title
    document.value.updatedAt = Date.now()
  }

  function updateGlobalFormat(format: Partial<FormatConfig>) {
    document.value.globalFormat = { ...document.value.globalFormat, ...format }
    document.value.updatedAt = Date.now()
  }

  function setDocument(newDoc: Document) {
    document.value = newDoc
    activeColumnId.value = ''
    activeParagraphId.value = ''
    selection.value = null
  }

  function resetDocument() {
    document.value = createInitialDocument()
    activeColumnId.value = ''
    activeParagraphId.value = ''
    selection.value = null
  }

  return {
    document,
    activeColumnId,
    activeParagraphId,
    selection,
    isDragging,
    dragData,
    dropTarget,
    isResizing,
    resizingColumnIndex,
    wordCount,
    paragraphCount,
    getColumnById,
    getParagraphById,
    getParagraphIndex,
    setActiveColumn,
    setActiveParagraph,
    setSelection,
    updateParagraphContent,
    updateParagraphFormat,
    updateParagraphType,
    addParagraph,
    removeParagraph,
    moveParagraph,
    setColumnCount,
    updateColumnWidth,
    setDragging,
    setDragData,
    setDropTarget,
    setResizing,
    setResizingColumnIndex,
    updateTitle,
    updateGlobalFormat,
    setDocument,
    resetDocument,
  }
})
