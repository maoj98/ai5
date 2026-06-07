import { nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { useHistory } from './useHistory'
import type { Paragraph, ParagraphType } from '@/types/document'
import type { FormatConfig } from '@/types/format'
import { createEmptyParagraph } from '@/utils/richText'
import { saveSelection, restoreSelection } from '@/utils/selection'
import { generateId } from '@/utils/dom'

export function useEditor() {
  const editorStore = useEditorStore()
  const { recordHistory } = useHistory()

  const {
    document,
    activeColumnId,
    activeParagraphId,
    selection,
    isDragging,
    isResizing,
    wordCount,
    paragraphCount,
  } = storeToRefs(editorStore)

  function handleParagraphInput(columnId: string, paragraphId: string, content: string) {
    editorStore.updateParagraphContent(columnId, paragraphId, content)
    recordHistory('编辑内容')
  }

  function handleParagraphFormat(
    columnId: string,
    paragraphId: string,
    format: Partial<FormatConfig>
  ) {
    const selectionState = saveSelection()
    editorStore.updateParagraphFormat(columnId, paragraphId, format)
    recordHistory('修改格式', true)
    nextTick(() => {
      restoreSelection(selectionState)
    })
  }

  function handleParagraphType(
    columnId: string,
    paragraphId: string,
    type: ParagraphType,
    level?: number
  ) {
    const selectionState = saveSelection()
    editorStore.updateParagraphType(columnId, paragraphId, type, level)
    recordHistory('修改段落类型', true)
    nextTick(() => {
      restoreSelection(selectionState)
    })
  }

  function handleAddParagraph(columnId: string, afterParagraphId: string | null): Paragraph {
    const selectionState = saveSelection()
    const newParagraph = editorStore.addParagraph(columnId, afterParagraphId)
    recordHistory('添加段落', true)
    nextTick(() => {
      editorStore.setActiveParagraph(columnId, newParagraph.id)
      const element = window.document.querySelector(
        `[data-paragraph-id="${newParagraph.id}"]`
      ) as HTMLElement
      element?.focus()
    })
    return newParagraph
  }

  function handleRemoveParagraph(columnId: string, paragraphId: string) {
    const column = editorStore.getColumnById(columnId)
    if (!column || column.paragraphs.length <= 1) return

    const index = editorStore.getParagraphIndex(columnId, paragraphId)
    const prevParagraph = column.paragraphs[index - 1]

    editorStore.removeParagraph(columnId, paragraphId)
    recordHistory('删除段落', true)

    if (prevParagraph) {
      nextTick(() => {
        editorStore.setActiveParagraph(columnId, prevParagraph.id)
        const element = window.document.querySelector(
          `[data-paragraph-id="${prevParagraph.id}"]`
        ) as HTMLElement
        element?.focus()
      })
    }
  }

  function handleMoveParagraph(
    sourceColumnId: string,
    sourceIndex: number,
    targetColumnId: string,
    targetIndex: number
  ) {
    editorStore.moveParagraph(sourceColumnId, sourceIndex, targetColumnId, targetIndex)
    recordHistory('移动段落', true)
  }

  function handleSetColumnCount(count: 1 | 2 | 3) {
    editorStore.setColumnCount(count)
    recordHistory('修改分栏数', true)
  }

  function handleUpdateColumnWidth(columnIndex: number, width: number) {
    editorStore.updateColumnWidth(columnIndex, width)
  }

  function handleUpdateTitle(title: string) {
    editorStore.updateTitle(title)
    recordHistory('修改标题')
  }

  function handleUpdateGlobalFormat(format: Partial<FormatConfig>) {
    editorStore.updateGlobalFormat(format)
    recordHistory('修改全局格式', true)
  }

  function handleResetDocument() {
    editorStore.resetDocument()
    recordHistory('重置文档', true)
  }

  function handleSelectParagraph(columnId: string, paragraphId: string) {
    editorStore.setActiveParagraph(columnId, paragraphId)
  }

  function handleSelectColumn(columnId: string) {
    editorStore.setActiveColumn(columnId)
  }

  function getParagraphContent(columnId: string, paragraphId: string): string {
    const paragraph = editorStore.getParagraphById(columnId, paragraphId)
    return paragraph?.content || ''
  }

  function getParagraphFormat(columnId: string, paragraphId: string): FormatConfig | undefined {
    const paragraph = editorStore.getParagraphById(columnId, paragraphId)
    return paragraph?.format
  }

  return {
    document,
    activeColumnId,
    activeParagraphId,
    selection,
    isDragging,
    isResizing,
    wordCount,
    paragraphCount,
    handleParagraphInput,
    handleParagraphFormat,
    handleParagraphType,
    handleAddParagraph,
    handleRemoveParagraph,
    handleMoveParagraph,
    handleSetColumnCount,
    handleUpdateColumnWidth,
    handleUpdateTitle,
    handleUpdateGlobalFormat,
    handleResetDocument,
    handleSelectParagraph,
    handleSelectColumn,
    getParagraphContent,
    getParagraphFormat,
  }
}
