import type { SelectionState } from '@/types/document'

export function saveSelection(): SelectionState | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)
  const startContainer = range.startContainer
  const endContainer = range.endContainer

  const paragraphElement = findParagraphElement(startContainer as Node)
  if (!paragraphElement) return null

  const columnElement = findColumnElement(paragraphElement)
  if (!columnElement) return null

  return {
    columnId: columnElement.dataset.columnId || '',
    paragraphId: paragraphElement.dataset.paragraphId || '',
    startOffset: range.startOffset,
    endOffset: range.endOffset,
  }
}

export function restoreSelection(selectionState: SelectionState | null): boolean {
  if (!selectionState) return false

  const paragraphElement = document.querySelector(
    `[data-paragraph-id="${selectionState.paragraphId}"]`
  ) as HTMLElement
  if (!paragraphElement) return false

  const textNode = getFirstTextNode(paragraphElement)
  if (!textNode) return false

  const selection = window.getSelection()
  if (!selection) return false

  const range = document.createRange()
  const maxOffset = textNode.textContent?.length || 0
  const startOffset = Math.min(selectionState.startOffset, maxOffset)
  const endOffset = Math.min(selectionState.endOffset, maxOffset)

  range.setStart(textNode, startOffset)
  range.setEnd(textNode, endOffset)

  selection.removeAllRanges()
  selection.addRange(range)

  return true
}

export function getSelectedText(): string {
  const selection = window.getSelection()
  return selection?.toString() || ''
}

export function isSelectionCollapsed(): boolean {
  const selection = window.getSelection()
  return selection?.isCollapsed ?? true
}

export function clearSelection(): void {
  const selection = window.getSelection()
  selection?.removeAllRanges()
}

function findParagraphElement(node: Node): HTMLElement | null {
  let current: Node | null = node
  while (current) {
    if (current instanceof HTMLElement && current.dataset.paragraphId) {
      return current
    }
    current = current.parentNode
  }
  return null
}

function findColumnElement(node: Node): HTMLElement | null {
  let current: Node | null = node
  while (current) {
    if (current instanceof HTMLElement && current.dataset.columnId) {
      return current
    }
    current = current.parentNode
  }
  return null
}

function getFirstTextNode(element: HTMLElement): Text | null {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
  return walker.nextNode() as Text | null
}

export function getSelectionFormat(): Record<string, string> {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return {}

  const range = selection.getRangeAt(0)
  let container = range.commonAncestorContainer

  if (container.nodeType === Node.TEXT_NODE) {
    container = container.parentNode as Node
  }

  const element = container as HTMLElement
  const computedStyle = window.getComputedStyle(element)

  return {
    fontWeight: computedStyle.fontWeight === '700' || computedStyle.fontWeight === 'bold' ? 'bold' : 'normal',
    fontStyle: computedStyle.fontStyle,
    textDecoration: computedStyle.textDecorationLine || 'none',
    color: computedStyle.color,
    fontFamily: computedStyle.fontFamily,
    fontSize: computedStyle.fontSize,
    textAlign: computedStyle.textAlign,
    lineHeight: computedStyle.lineHeight,
  }
}
