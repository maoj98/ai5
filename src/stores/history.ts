import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { HistorySnapshot, Document, SelectionState } from '@/types/document'
import { generateId } from '@/utils/dom'

const MAX_HISTORY = 50

export const useHistoryStore = defineStore('history', () => {
  const past = ref<HistorySnapshot[]>([])
  const future = ref<HistorySnapshot[]>([])
  const current = ref<HistorySnapshot | null>(null)
  const maxHistory = ref(MAX_HISTORY)

  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  function createSnapshot(
    document: Document,
    selection: SelectionState | null,
    description: string = ''
  ): HistorySnapshot {
    return {
      id: generateId(),
      timestamp: Date.now(),
      document: JSON.parse(JSON.stringify(document)),
      selection: selection ? JSON.parse(JSON.stringify(selection)) : null,
      description,
    }
  }

  function pushHistory(
    document: Document,
    selection: SelectionState | null,
    description: string = ''
  ) {
    if (current.value) {
      past.value.push(current.value)
    }

    current.value = createSnapshot(document, selection, description)
    future.value = []

    if (past.value.length > maxHistory.value) {
      past.value.shift()
    }
  }

  function undo(): HistorySnapshot | null {
    if (!canUndo.value) return null

    if (current.value) {
      future.value.unshift(current.value)
    }

    const snapshot = past.value.pop() || null
    current.value = snapshot

    return snapshot
  }

  function redo(): HistorySnapshot | null {
    if (!canRedo.value) return null

    if (current.value) {
      past.value.push(current.value)
    }

    const snapshot = future.value.shift() || null
    current.value = snapshot

    return snapshot
  }

  function replaceCurrent(
    document: Document,
    selection: SelectionState | null,
    description: string = ''
  ) {
    current.value = createSnapshot(document, selection, description)
  }

  function clearHistory() {
    past.value = []
    future.value = []
    current.value = null
  }

  function saveToLocalStorage(key: string = 'editor-history') {
    try {
      const data = {
        past: past.value,
        future: future.value,
        current: current.value,
        maxHistory: maxHistory.value,
      }
      localStorage.setItem(key, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save history to localStorage:', e)
    }
  }

  function loadFromLocalStorage(key: string = 'editor-history'): boolean {
    try {
      const data = localStorage.getItem(key)
      if (!data) return false

      const parsed = JSON.parse(data)
      past.value = parsed.past || []
      future.value = parsed.future || []
      current.value = parsed.current || null
      maxHistory.value = parsed.maxHistory || MAX_HISTORY

      return true
    } catch (e) {
      console.error('Failed to load history from localStorage:', e)
      return false
    }
  }

  return {
    past,
    future,
    current,
    maxHistory,
    canUndo,
    canRedo,
    createSnapshot,
    pushHistory,
    undo,
    redo,
    replaceCurrent,
    clearHistory,
    saveToLocalStorage,
    loadFromLocalStorage,
  }
})
