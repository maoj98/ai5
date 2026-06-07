import type { FormatConfig } from './format'

export type ParagraphType = 'text' | 'heading' | 'list' | 'quote' | 'code' | 'image'

export interface Paragraph {
  id: string
  type: ParagraphType
  content: string
  format: FormatConfig
  level?: number
  metadata?: Record<string, any>
}

export interface Column {
  id: string
  width: number
  paragraphs: Paragraph[]
}

export interface Document {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  columns: Column[]
  columnCount: 1 | 2 | 3
  columnWidths: number[]
  globalFormat: FormatConfig
}

export interface SelectionState {
  columnId: string
  paragraphId: string
  startOffset: number
  endOffset: number
}

export interface DragData {
  type: 'paragraph' | 'column'
  sourceColumnId: string
  sourceIndex: number
  paragraphId?: string
}

export interface HistorySnapshot {
  id: string
  timestamp: number
  document: Document
  selection: SelectionState | null
  description: string
}

export interface ClipboardData {
  type: 'text/html' | 'text/plain' | 'application/json'
  content: string
  format?: FormatConfig
}
