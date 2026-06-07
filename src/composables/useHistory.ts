import { nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useHistoryStore } from '@/stores/history'
import { useEditorStore } from '@/stores/editor'
import type { SelectionState } from '@/types/document'
import { saveSelection, restoreSelection } from '@/utils/selection'
import { debounce } from '@/utils/debounce'

export function useHistory() {
  const historyStore = useHistoryStore()
  const editorStore = useEditorStore()

  const { past, future, canUndo, canRedo } = storeToRefs(historyStore)

  const pushHistoryDebounced = debounce(
    (description: string = '') => {
      const selection = saveSelection()
      historyStore.pushHistory(editorStore.document, selection, description)
    },
    500
  )

  function recordHistory(description: string = '', immediate: boolean = false) {
    if (immediate) {
      const selection = saveSelection()
      historyStore.pushHistory(editorStore.document, selection, description)
    } else {
      pushHistoryDebounced(description)
    }
  }

  function undo(): boolean {
    const snapshot = historyStore.undo()
    if (!snapshot) return false

    editorStore.setDocument(snapshot.document)
    
    nextTick(() => {
      restoreSelection(snapshot.selection as SelectionState | null)
    })

    return true
  }

  function redo(): boolean {
    const snapshot = historyStore.redo()
    if (!snapshot) return false

    editorStore.setDocument(snapshot.document)
    
    nextTick(() => {
      restoreSelection(snapshot.selection as SelectionState | null)
    })

    return true
  }

  function setupKeyboardShortcuts() {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeydown)

    return () => {
      window.removeEventListener('keydown', handleKeydown)
    }
  }

  function saveToLocalStorage() {
    historyStore.saveToLocalStorage()
  }

  function loadFromLocalStorage(): boolean {
    return historyStore.loadFromLocalStorage()
  }

  return {
    past,
    future,
    canUndo,
    canRedo,
    recordHistory,
    undo,
    redo,
    setupKeyboardShortcuts,
    saveToLocalStorage,
    loadFromLocalStorage,
  }
}
