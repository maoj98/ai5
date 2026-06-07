import type { Document, Paragraph } from '@/types/document'
import type { FormatConfig } from '@/types/format'
import { defaultFormatConfig } from '@/types/format'
import { generateId } from '@/utils/dom'

export class ImportExportService {
  static exportToJSON(document: Document): string {
    return JSON.stringify(document, null, 2)
  }

  static importFromJSON(json: string): Document {
    const parsed = JSON.parse(json) as Document
    this.validateDocument(parsed)
    return parsed
  }

  static exportToMarkdown(document: Document): string {
    let markdown = `# ${document.title}\n\n`

    document.columns.forEach((column, colIndex) => {
      if (document.columnCount > 1) {
        markdown += `--- Column ${colIndex + 1} ---\n\n`
      }

      column.paragraphs.forEach((paragraph) => {
        markdown += this.paragraphToMarkdown(paragraph) + '\n\n'
      })
    })

    return markdown
  }

  static importFromMarkdown(markdown: string, columnCount: 1 | 2 | 3 = 1): Document {
    const lines = markdown.split('\n')
    const columns: Document['columns'] = []
    const columnWidth = 100 / columnCount

    for (let i = 0; i < columnCount; i++) {
      columns.push({
        id: generateId(),
        width: columnWidth,
        paragraphs: [],
      })
    }

    let currentColumnIndex = 0
    let currentParagraph: Paragraph | null = null
    let inCodeBlock = false
    let codeContent = ''

    const columnRegex = /^---\s*Column\s+(\d+)\s*---$/i

    lines.forEach((line) => {
      const columnMatch = line.match(columnRegex)
      if (columnMatch) {
        const colNum = parseInt(columnMatch[1]) - 1
        if (colNum >= 0 && colNum < columnCount) {
          if (currentParagraph) {
            columns[currentColumnIndex].paragraphs.push(currentParagraph)
            currentParagraph = null
          }
          currentColumnIndex = colNum
        }
        return
      }

      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true
          codeContent = ''
          if (currentParagraph) {
            columns[currentColumnIndex].paragraphs.push(currentParagraph)
          }
          currentParagraph = {
            id: generateId(),
            type: 'code',
            content: '',
            format: {
              ...defaultFormatConfig,
              fontFamily: 'JetBrains Mono, Consolas, monospace',
              fontSize: 14,
            },
          }
        } else {
          inCodeBlock = false
          if (currentParagraph) {
            currentParagraph.content = codeContent.trim()
            columns[currentColumnIndex].paragraphs.push(currentParagraph)
            currentParagraph = null
          }
        }
        return
      }

      if (inCodeBlock) {
        codeContent += line + '\n'
        return
      }

      if (line.startsWith('# ')) {
        if (currentParagraph) {
          columns[currentColumnIndex].paragraphs.push(currentParagraph)
        }
        currentParagraph = {
          id: generateId(),
          type: 'heading',
          level: 1,
          content: line.substring(2).trim(),
          format: {
            ...defaultFormatConfig,
            fontSize: 32,
            fontWeight: 'bold',
          },
        }
      } else if (line.startsWith('## ')) {
        if (currentParagraph) {
          columns[currentColumnIndex].paragraphs.push(currentParagraph)
        }
        currentParagraph = {
          id: generateId(),
          type: 'heading',
          level: 2,
          content: line.substring(3).trim(),
          format: {
            ...defaultFormatConfig,
            fontSize: 24,
            fontWeight: 'bold',
          },
        }
      } else if (line.startsWith('### ')) {
        if (currentParagraph) {
          columns[currentColumnIndex].paragraphs.push(currentParagraph)
        }
        currentParagraph = {
          id: generateId(),
          type: 'heading',
          level: 3,
          content: line.substring(4).trim(),
          format: {
            ...defaultFormatConfig,
            fontSize: 20,
            fontWeight: 'bold',
          },
        }
      } else if (line.startsWith('> ')) {
        if (currentParagraph?.type === 'quote') {
          currentParagraph.content += '\n' + line.substring(2)
        } else {
          if (currentParagraph) {
            columns[currentColumnIndex].paragraphs.push(currentParagraph)
          }
          currentParagraph = {
            id: generateId(),
            type: 'quote',
            content: line.substring(2),
            format: {
              ...defaultFormatConfig,
              fontStyle: 'italic',
              color: '#666666',
            },
          }
        }
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        if (currentParagraph?.type === 'list') {
          currentParagraph.content += '\n' + '• ' + line.substring(2)
        } else {
          if (currentParagraph) {
            columns[currentColumnIndex].paragraphs.push(currentParagraph)
          }
          currentParagraph = {
            id: generateId(),
            type: 'list',
            content: '• ' + line.substring(2),
            format: { ...defaultFormatConfig },
          }
        }
      } else if (line.trim() === '') {
        if (currentParagraph) {
          columns[currentColumnIndex].paragraphs.push(currentParagraph)
          currentParagraph = null
        }
      } else {
        if (currentParagraph?.type === 'text') {
          currentParagraph.content += '\n' + line
        } else {
          if (currentParagraph) {
            columns[currentColumnIndex].paragraphs.push(currentParagraph)
          }
          currentParagraph = {
            id: generateId(),
            type: 'text',
            content: line,
            format: { ...defaultFormatConfig },
          }
        }
      }
    })

    if (currentParagraph) {
      columns[currentColumnIndex].paragraphs.push(currentParagraph)
    }

    columns.forEach((col) => {
      if (col.paragraphs.length === 0) {
        col.paragraphs.push({
          id: generateId(),
          type: 'text',
          content: '',
          format: { ...defaultFormatConfig },
        })
      }
    })

    return {
      id: generateId(),
      title: this.extractTitleFromMarkdown(markdown) || '未命名文档',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      columnCount: columnCount as 1 | 2 | 3,
      columnWidths: columns.map((c) => c.width),
      columns,
      globalFormat: { ...defaultFormatConfig },
    }
  }

  static exportToHtml(document: Document): string {
    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${document.title}</title>
  <style>
    body {
      font-family: ${document.globalFormat.fontFamily};
      font-size: ${document.globalFormat.fontSize}px;
      line-height: ${document.globalFormat.lineHeight};
      color: ${document.globalFormat.color};
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .columns-container {
      display: flex;
      gap: 40px;
    }
    .column {
      flex: 1;
    }
    h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
    h2 { font-size: 1.5em; font-weight: bold; margin: 0.75em 0; }
    h3 { font-size: 1.17em; font-weight: bold; margin: 0.83em 0; }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 20px;
      margin-left: 0;
      font-style: italic;
      color: #666;
    }
    pre {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
      font-family: 'JetBrains Mono', Consolas, monospace;
    }
    ul, ol {
      padding-left: 24px;
    }
  </style>
</head>
<body>
  <h1>${document.title}</h1>
  <div class="columns-container">
`

    document.columns.forEach((column) => {
      html += '    <div class="column">\n'
      column.paragraphs.forEach((paragraph) => {
        html += this.paragraphToHtml(paragraph) + '\n'
      })
      html += '    </div>\n'
    })

    html += `  </div>
</body>
</html>`

    return html
  }

  static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  static readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  private static validateDocument(doc: unknown): asserts doc is Document {
    const d = doc as Record<string, unknown>
    if (!d || typeof d !== 'object') {
      throw new Error('Invalid document format')
    }
    if (!Array.isArray(d.columns)) {
      throw new Error('Document must have columns array')
    }
  }

  private static paragraphToMarkdown(paragraph: Paragraph): string {
    const content = paragraph.content

    switch (paragraph.type) {
      case 'heading':
        const level = paragraph.level || 1
        return `${'#'.repeat(level)} ${content}`
      case 'list':
        return content
          .split('\n')
          .map((line) => `- ${line.replace(/^[•\-*]\s*/, '')}`)
          .join('\n')
      case 'quote':
        return content
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n')
      case 'code':
        return `\`\`\`\n${content}\n\`\`\``
      case 'text':
      default:
        return content
    }
  }

  private static paragraphToHtml(paragraph: Paragraph): string {
    const content = paragraph.content
    const style = this.formatToStyleAttribute(paragraph.format)

    switch (paragraph.type) {
      case 'heading':
        const level = paragraph.level || 1
        return `      <h${level} style="${style}">${this.escapeHtml(content)}</h${level}>`
      case 'list':
        const items = content.split('\n').filter((l) => l.trim())
        const listItems = items
          .map((item) => `        <li>${this.escapeHtml(item.replace(/^[•\-*]\s*/, ''))}</li>`)
          .join('\n')
        return `      <ul style="${style}">\n${listItems}\n      </ul>`
      case 'quote':
        return `      <blockquote style="${style}">${this.escapeHtml(content)}</blockquote>`
      case 'code':
        return `      <pre style="${style}"><code>${this.escapeHtml(content)}</code></pre>`
      case 'text':
      default:
        return `      <p style="${style}">${this.escapeHtml(content)}</p>`
    }
  }

  private static formatToStyleAttribute(format: FormatConfig): string {
    const styles: string[] = []
    if (format.fontFamily) styles.push(`font-family: ${format.fontFamily}`)
    if (format.fontSize) styles.push(`font-size: ${format.fontSize}px`)
    if (format.fontWeight) styles.push(`font-weight: ${format.fontWeight}`)
    if (format.fontStyle) styles.push(`font-style: ${format.fontStyle}`)
    if (format.color) styles.push(`color: ${format.color}`)
    if (format.textAlign) styles.push(`text-align: ${format.textAlign}`)
    if (format.lineHeight) styles.push(`line-height: ${format.lineHeight}`)
    return styles.join('; ')
  }

  private static escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  private static extractTitleFromMarkdown(markdown: string): string {
    const match = markdown.match(/^#\s+(.+)$/m)
    return match ? match[1].trim() : ''
  }
}
